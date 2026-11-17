import { apiJson } from "@/lib/api";
import { clientIpFrom, originAllowed, readJson } from "@/lib/guard";
import { getOrder, updateOrder } from "@/lib/orders";
import { createPayPalOrder } from "@/lib/paypal";
import { chargeCents } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { safeEqualString } from "@/lib/secret";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!originAllowed(request)) return apiJson({ error: "Invalid request." }, 403);
  const limit = rateLimit(`paypal-order:${clientIpFrom(request.headers)}`, 12, 10 * 60 * 1000);
  if (!limit.ok) return apiJson({ error: "Too many payment attempts. Please wait and try again." }, 429);

  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return apiJson({ error: "Invalid request." }, 400);
  }
  const record = (body ?? {}) as { code?: unknown; token?: unknown };
  const code = typeof record.code === "string" ? record.code : "";
  const token = typeof record.token === "string" ? record.token : "";

  const order = code ? await getOrder(code).catch(() => null) : null;
  if (!order || !safeEqualString(order.token, token)) return apiJson({ error: "Order not found." }, 404);
  if (order.status !== "pending") return apiJson({ error: "This order can no longer be paid." }, 409);
  if (chargeCents(order) === null) return apiJson({ error: "This order can no longer be paid." }, 409);
  if (order.paymentOrderId) return apiJson({ id: order.paymentOrderId });

  try {
    const id = await createPayPalOrder({
      code: order.code,
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      shippingWaived: order.shippingWaived,
      shipThreshold: order.shipThreshold,
      shipFlat: order.shipFlat,
      items: order.items.map((item) => ({ name: item.name, qty: item.qty, unitPrice: item.unitPrice })),
    });
    const saved = await updateOrder(order.code, { paymentOrderId: id }, ["pending"], { requireUnsetPayment: true });
    if (saved) return apiJson({ id });
    const again = await getOrder(order.code);
    if (again?.status === "pending" && again.paymentOrderId) return apiJson({ id: again.paymentOrderId });
    return apiJson({ error: "This order can no longer be paid." }, 409);
  } catch (err) {
    console.error("[paypal] create order failed", err instanceof Error ? err.message : err);
    return apiJson({ error: "We couldn't start PayPal checkout. Please try again." }, 502);
  }
}
