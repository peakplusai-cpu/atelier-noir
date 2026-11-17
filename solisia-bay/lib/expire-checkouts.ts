import { toCents } from "./money";
import { listStalePendingOrders, updateOrder, type Order } from "./orders";
import { inspectPayPalOrder, type PayPalView } from "./paypal";
import { getShop, releaseHold, type ShopData } from "./shop";

export const CHECKOUT_HOLD_MS = 45 * 60 * 1000;
/** PayPal reads on a shopper request. Long enough to see a capture, short enough not to stall checkout. */
export const ON_DEMAND_INSPECT_MS = 1200;
const CRON_INSPECT_MS = 5000;

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

function withDeadline(work: Promise<PayPalView>, ms: number): Promise<PayPalView> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ kind: "unknown" }), ms);
    work.then(
      (view) => {
        clearTimeout(timer);
        resolve(view);
      },
      () => {
        clearTimeout(timer);
        resolve({ kind: "unknown" });
      }
    );
  });
}

function needsPayPal(order: Order): boolean {
  return Boolean(order.paymentOrderId && order.paymentOrderId !== "demo");
}

/**
 * Cancels unpaid orders older than 45 minutes and returns their stock and coupon use.
 * One query finds the stale rows. PayPal is checked only when a paypalOrderId exists.
 * A capture that lands during the run keeps the order and the reservation.
 */
export async function expireAbandonedCheckouts(options?: {
  now?: number;
  holdMs?: number;
  inspect?: (paypalOrderId: string) => Promise<PayPalView>;
  inspectTimeoutMs?: number;
}): Promise<ExpireResult> {
  const now = options?.now ?? Date.now();
  const holdMs = options?.holdMs ?? CHECKOUT_HOLD_MS;
  const timeoutMs = options?.inspectTimeoutMs ?? CRON_INSPECT_MS;
  const inspect = options?.inspect ?? ((id: string) => inspectPayPalOrder(id, timeoutMs));
  const read = (id: string) => withDeadline(inspect(id), timeoutMs);
  const cutoff = new Date(now - holdMs).toISOString();
  const stale = await listStalePendingOrders(cutoff);
  const cancelled: string[] = [];
  const kept: string[] = [];

  const firstLook = new Map<string, PayPalView>();
  await Promise.all(
    stale.filter(needsPayPal).map(async (order) => {
      firstLook.set(order.code, await read(order.paymentOrderId!));
    })
  );

  const marked: Order[] = [];
  for (const order of stale) {
    const view = firstLook.get(order.code);
    if (view?.kind === "captured") {
      await keepCaptured(order, view);
      kept.push(order.code);
      continue;
    }
    if (view?.kind === "unknown") {
      kept.push(order.code);
      continue;
    }
    const updated = await updateOrder(order.code, { status: "cancelled" }, ["pending"]);
    if (!updated) {
      kept.push(order.code);
      continue;
    }
    marked.push(order);
  }

  const secondLook = new Map<string, PayPalView>();
  await Promise.all(
    marked.filter(needsPayPal).map(async (order) => {
      secondLook.set(order.code, await read(order.paymentOrderId!));
    })
  );

  for (const order of marked) {
    const again = secondLook.get(order.code);
    if (again?.kind === "captured" || again?.kind === "unknown") {
      if (again.kind === "captured") await keepCaptured(order, again);
      else await updateOrder(order.code, { status: "pending" }, ["cancelled"]);
      kept.push(order.code);
      continue;
    }
    if (order.stockHeld) await releaseCancelled(order);
    cancelled.push(order.code);
  }

  return { cancelled, kept };
}

let inflight: Promise<void> | null = null;

/** Runs the same expiry on the request path. Failures are logged so a shopper can still continue. */
export function releaseStaleHolds(): Promise<void> {
  if (inflight) return inflight;
  let run: Promise<void>;
  run = expireAbandonedCheckouts({ inspectTimeoutMs: ON_DEMAND_INSPECT_MS })
    .then(() => undefined)
    .catch((err) => {
      console.error("[holds] could not release stale checkouts", err instanceof Error ? err.message : err);
    })
    .finally(() => {
      if (inflight === run) inflight = null;
    });
  inflight = run;
  return run;
}

/** Stock shown on the product page and in the cart, after abandoned holds are released. */
export async function loadPublicShop(): Promise<ShopData> {
  await releaseStaleHolds();
  return getShop();
}
