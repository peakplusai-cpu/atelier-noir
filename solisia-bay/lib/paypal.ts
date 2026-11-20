import { centsToMoney, parseMoneyToCents, toCents } from "./money";
import { chargeCents } from "./pricing";

const LIVE = "https://api-m.paypal.com";
const SANDBOX = "https://api-m.sandbox.paypal.com";

function apiBase(): string {
  if (process.env.PAYPAL_API_BASE) return process.env.PAYPAL_API_BASE.replace(/\/$/, "");
  return (process.env.PAYPAL_ENV ?? "").toLowerCase() === "live" ? LIVE : SANDBOX;
}

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

type PayPalError = Error & { status?: number };

async function paypal<T>(path: string, init: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${apiBase()}${path}`, { ...init, headers, cache: "no-store" });
  const text = await res.text();
  let json: unknown = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const err = new Error(`PayPal ${res.status}: ${text.slice(0, 300)}`) as PayPalError;
    err.status = res.status;
    throw err;
  }
  return json as T;
}

async function accessToken(signal?: AbortSignal): Promise<string> {
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await paypal<{ access_token?: string }>("/v1/oauth2/token", {
    method: "POST",
    headers: { authorization: `Basic ${basic}`, "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    signal,
  });
  if (!res.access_token) throw new Error("PayPal did not return an access token");
  return res.access_token;
}

export type PayPalItem = { name: string; qty: number; unitPrice: number };

export async function createPayPalOrder(input: {
  code: string;
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  shippingWaived?: boolean;
  shipThreshold?: number;
  shipFlat?: number;
  items: PayPalItem[];
}): Promise<string> {
  const expected = chargeCents(input);
  if (expected === null) throw new Error("Order totals are inconsistent");
  const itemCents = input.items.reduce((sum, item) => sum + toCents(item.unitPrice) * item.qty, 0);
  const discountCents = toCents(input.discount ?? 0);
  const shippingCents = expected - itemCents + discountCents;
  const token = await accessToken();
  const res = await paypal<{ id?: string }>("/v2/checkout/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      application_context: { brand_name: "CLACK" },
      purchase_units: [
        {
          custom_id: input.code,
          description: `CLACK order ${input.code}`,
          amount: {
            currency_code: "USD",
            value: centsToMoney(expected),
            breakdown: {
              item_total: { currency_code: "USD", value: centsToMoney(itemCents) },
              shipping: { currency_code: "USD", value: centsToMoney(shippingCents) },
              ...(discountCents > 0 ? { discount: { currency_code: "USD", value: centsToMoney(discountCents) } } : {}),
            },
          },
          items: input.items.map((item) => ({
            name: item.name.slice(0, 127),
            quantity: String(item.qty),
            unit_amount: { currency_code: "USD", value: centsToMoney(toCents(item.unitPrice)) },
          })),
        },
      ],
    }),
  }, token);
  if (!res.id) throw new Error("PayPal did not return an order id");
  return res.id;
}

type Capture = { id?: string; status?: string; amount?: { currency_code?: string; value?: string } };
type PayPalOrder = {
  id?: string;
  status?: string;
  purchase_units?: { custom_id?: string; payments?: { captures?: Capture[] } }[];
};

export type PayPalCapture = { captureId: string; amountCents: number; currency: string; customId: string };

function readCapture(order: PayPalOrder): PayPalCapture | null {
  if (order.status !== "COMPLETED") return null;
  const unit = order.purchase_units?.[0];
  const capture = unit?.payments?.captures?.find((item) => item.status === "COMPLETED");
  if (!capture?.id || !capture.amount?.value || !unit?.custom_id) return null;
  const amountCents = parseMoneyToCents(capture.amount.value);
  if (amountCents === null) return null;
  return {
    captureId: capture.id,
    amountCents,
    currency: (capture.amount.currency_code ?? "").toUpperCase(),
    customId: unit.custom_id,
  };
}

export type PayPalView =
  | { kind: "captured"; capture: PayPalCapture | null }
  | { kind: "open" | "voided" | "unknown" };

/** Reads a PayPal order without capturing it. Unknown means do not cancel the local order. */
export async function inspectPayPalOrder(paypalOrderId: string, timeoutMs = 5000): Promise<PayPalView> {
  if (!paypalConfigured() || !/^[A-Za-z0-9_-]{8,40}$/.test(paypalOrderId)) return { kind: "unknown" };
  try {
    const signal = AbortSignal.timeout(Math.max(1, timeoutMs));
    const token = await accessToken(signal);
    const order = await paypal<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, { method: "GET", signal }, token);
    if (order.status === "VOIDED") return { kind: "voided" };
    const captured = order.status === "COMPLETED" || Boolean(order.purchase_units?.some((unit) => unit.payments?.captures?.some((item) => item.status === "COMPLETED")));
    if (captured) return { kind: "captured", capture: readCapture({ ...order, status: "COMPLETED" }) };
    return { kind: "open" };
  } catch {
    return { kind: "unknown" };
  }
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCapture> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(paypalOrderId)) throw new Error("Invalid PayPal order id");
  const token = await accessToken();
  let order: PayPalOrder;
  try {
    order = await paypal<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: "POST",
      headers: { "content-type": "application/json" },
    }, token);
  } catch (err) {
    // A repeated capture of an already-captured order comes back as an error; read the order instead.
    try {
      order = await paypal<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, { method: "GET" }, token);
    } catch {
      throw err;
    }
  }
  const capture = readCapture(order);
  if (!capture) throw new Error("PayPal capture was not completed");
  return capture;
}
