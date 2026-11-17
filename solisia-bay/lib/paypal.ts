const LIVE = "https://api-m.paypal.com";
const SANDBOX = "https://api-m.sandbox.paypal.com";

function apiBase(): string {
  if (process.env.PAYPAL_API_BASE) return process.env.PAYPAL_API_BASE.replace(/\/$/, "");
  return (process.env.PAYPAL_ENV ?? "").toLowerCase() === "live" ? LIVE : SANDBOX;
}

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function paypalClientId(): string {
  return process.env.PAYPAL_CLIENT_ID ?? "";
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

async function accessToken(): Promise<string> {
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await paypal<{ access_token?: string }>("/v1/oauth2/token", {
    method: "POST",
    headers: { authorization: `Basic ${basic}`, "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.access_token) throw new Error("PayPal did not return an access token");
  return res.access_token;
}

const money = (n: number) => n.toFixed(2);

export type PayPalItem = { name: string; qty: number; unitPrice: number };

export async function createPayPalOrder(input: {
  code: string;
  subtotal: number;
  shipping: number;
  total: number;
  items: PayPalItem[];
}): Promise<string> {
  const token = await accessToken();
  const res = await paypal<{ id?: string }>("/v2/checkout/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: input.code,
          description: `SOLISIA BAY order ${input.code}`,
          amount: {
            currency_code: "USD",
            value: money(input.total),
            breakdown: {
              item_total: { currency_code: "USD", value: money(input.subtotal) },
              shipping: { currency_code: "USD", value: money(input.shipping) },
            },
          },
          items: input.items.map((i) => ({
            name: i.name.slice(0, 127),
            quantity: String(i.qty),
            unit_amount: { currency_code: "USD", value: money(i.unitPrice) },
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
  const unit = order.purchase_units?.[0];
  const capture = unit?.payments?.captures?.find((c) => c.status === "COMPLETED") ?? unit?.payments?.captures?.[0];
  if (!capture?.id || !capture.amount?.value || !unit?.custom_id) return null;
  return {
    captureId: capture.id,
    amountCents: Math.round(parseFloat(capture.amount.value) * 100),
    currency: capture.amount.currency_code ?? "",
    customId: unit.custom_id,
  };
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCapture> {
  const token = await accessToken();
  let order: PayPalOrder;
  try {
    order = await paypal<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: "POST",
      headers: { "content-type": "application/json" },
    }, token);
  } catch (err) {
    // A repeated capture of an already-captured order comes back as an error; read the order instead.
    order = await paypal<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, { method: "GET" }, token);
  }
  const capture = readCapture(order);
  if (!capture || order.status !== "COMPLETED") throw new Error("PayPal capture was not completed");
  return capture;
}
