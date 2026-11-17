import { toCents } from "./money";
import { listStalePendingOrders, updateOrder, type Order } from "./orders";
import { inspectPayPalOrder, type PayPalView } from "./paypal";
import { releaseHold } from "./shop";

export const CHECKOUT_HOLD_MS = 45 * 60 * 1000;

export type ExpireResult = { cancelled: string[]; kept: string[] };

async function releaseCancelled(order: Order): Promise<void> {
  const claimed = await updateOrder(order.code, { stockHeld: false }, ["cancelled"], { onlyIfStockHeld: true });
  if (!claimed) return;
  try {
    await releaseHold({ items: order.items, promoId: order.promoId, stockHeld: true });
  } catch (err) {
    await updateOrder(order.code, { stockHeld: true }, ["cancelled"]);
    throw err;
  }
}

async function keepCaptured(order: Order, view: PayPalView): Promise<void> {
  if (view.kind !== "captured" || !view.capture) return;
  const capture = view.capture;
  if (capture.customId !== order.code || capture.currency !== "USD" || capture.amountCents !== toCents(order.total)) return;
  await updateOrder(
    order.code,
    {
      status: "paid",
      paymentCaptureId: capture.captureId,
      amountPaidCents: capture.amountCents,
      paidAt: new Date().toISOString(),
    },
    ["pending", "cancelled"]
  );
}

/**
 * Cancels unpaid orders older than 45 minutes and returns their stock and coupon use.
 * A PayPal capture that lands during the run keeps the order and the reservation.
 */
export async function expireAbandonedCheckouts(options?: {
  now?: number;
  holdMs?: number;
  inspect?: (paypalOrderId: string) => Promise<PayPalView>;
}): Promise<ExpireResult> {
  const now = options?.now ?? Date.now();
  const holdMs = options?.holdMs ?? CHECKOUT_HOLD_MS;
  const inspect = options?.inspect ?? inspectPayPalOrder;
  const cutoff = new Date(now - holdMs).toISOString();
  const stale = await listStalePendingOrders(cutoff);
  const cancelled: string[] = [];
  const kept: string[] = [];

  for (const order of stale) {
    if (order.paymentOrderId && order.paymentOrderId !== "demo") {
      const view = await inspect(order.paymentOrderId);
      if (view.kind === "captured") {
        await keepCaptured(order, view);
        kept.push(order.code);
        continue;
      }
      if (view.kind === "unknown") {
        kept.push(order.code);
        continue;
      }
    }

    const marked = await updateOrder(order.code, { status: "cancelled" }, ["pending"]);
    if (!marked) {
      kept.push(order.code);
      continue;
    }

    if (order.paymentOrderId && order.paymentOrderId !== "demo") {
      const again = await inspect(order.paymentOrderId);
      if (again.kind === "captured" || again.kind === "unknown") {
        if (again.kind === "captured") await keepCaptured(order, again);
        else await updateOrder(order.code, { status: "pending" }, ["cancelled"]);
        kept.push(order.code);
        continue;
      }
    }

    if (order.stockHeld) await releaseCancelled(order);
    cancelled.push(order.code);
  }

  return { cancelled, kept };
}
