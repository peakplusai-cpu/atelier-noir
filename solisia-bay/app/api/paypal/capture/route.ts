import { apiJson } from "@/lib/api";
import { clientIpFrom, originAllowed, readJson } from "@/lib/guard";
import { translateError } from "@/lib/i18n";
import { marketFromRequest } from "@/lib/market";
import { getOrder, updateOrder, type OrderStatus } from "@/lib/orders";
import { capturePayPalOrder } from "@/lib/paypal";
import { chargeCents } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { safeEqualString } from "@/lib/secret";

export const dynamic = "force-dynamic";

const SETTLED: OrderStatus[] = ["paid", "shipped", "completed"];

async function markReview(code: string, captureId: string, amountCents: number): Promise<void> {
  const patch = {
    paymentCaptureId: captureId,
    amountPaidCents: amountCents,
    paidAt: new Date().toISOString(),
  };
  try {
    const reviewed = await updateOrder(code, { ...patch, status: "review" }, ["pending"]);
    if (reviewed) return;
  } catch (err) {
    console.error("[paypal] review status was rejected; run the solisia_orders status migration", err instanceof Error ? err.message : err);
  }
  try {
    await updateOrder(code, patch, ["pending"]);
  } catch (err) {
    console.error("[paypal] could not record mismatched capture", err instanceof Error ? err.message : err);
  }
}

export async function POST(request: Request) {
  const say = (message: string) => translateError(marketFromRequest(request).lang, message);
  if (!originAllowed(request)) return apiJson({ error: say("Invalid request.") }, 403);
  const limit = rateLimit(`paypal-capture:${clientIpFrom(request.headers)}`, 12, 10 * 60 * 1000);
  if (!limit.ok) return apiJson({ error: say("Too many payment attempts. Please wait and try again.") }, 429);

  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return apiJson({ error: say("Invalid request.") }, 400);
  }
  const record = (body ?? {}) as { code?: unknown; token?: unknown; paypalOrderId?: unknown };
  const code = typeof record.code === "string" ? record.code : "";
  const token = typeof record.token === "string" ? record.token : "";
  const paypalOrderId = typeof record.paypalOrderId === "string" ? record.paypalOrderId : "";

  const order = code ? await getOrder(code).catch(() => null) : null;
  if (!order || !safeEqualString(order.token, token)) return apiJson({ error: say("Order not found.") }, 404);
  if (SETTLED.includes(order.status)) return apiJson({ ok: true });
  if (order.status !== "pending" || !order.paymentOrderId || order.paymentOrderId === "demo" || !safeEqualString(order.paymentOrderId, paypalOrderId)) {
    return apiJson({ error: say("This payment doesn't match the order.") }, 409);
  }
  const expected = chargeCents(order);
  if (expected === null) return apiJson({ error: say("This payment doesn't match the order.") }, 409);

  try {
    const capture = await capturePayPalOrder(paypalOrderId);
    if (!safeEqualString(capture.customId, order.code) || capture.currency !== (order.currency || "USD") || capture.amountCents !== expected) {
      console.error("[paypal] capture mismatch", { code: order.code, capture, expected });
      await markReview(order.code, capture.captureId, capture.amountCents);
      return apiJson(
        { error: say("The payment amount didn't match the order. Please contact us before trying again.") },
        409
      );
    }
    const patch = {
      status: "paid" as const,
      paymentCaptureId: capture.captureId,
      amountPaidCents: capture.amountCents,
      paidAt: new Date().toISOString(),
    };
    const updated = await updateOrder(order.code, patch, ["pending"]);
    if (updated) return apiJson({ ok: true });
    const again = await getOrder(order.code);
    if (again && SETTLED.includes(again.status)) return apiJson({ ok: true });
    if (again && (again.status === "cancelled" || again.status === "failed")) {
      const restored = await updateOrder(order.code, patch, [again.status]);
      if (restored) return apiJson({ ok: true });
    }
    console.error("[paypal] captured funds but could not mark the order paid", order.code);
    return apiJson({ error: "The payment amount didn't match the order. Please contact us before trying again." }, 409);
  } catch (err) {
    console.error("[paypal] capture failed", err instanceof Error ? err.message : err);
    return apiJson(
      { error: "We couldn't confirm the payment. If PayPal shows a charge, contact us before trying again." },
      502
    );
  }
}
