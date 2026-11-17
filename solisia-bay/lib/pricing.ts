import { getProduct, sizeLabel, validateSelection } from "./catalog";
import { roundMoney, shippingFor, toCents } from "./money";

export const MAX_LINE_QTY = 10;
export const MAX_LINES = 20;

export type PricedItem = {
  slug: string;
  name: string;
  color: string;
  size: string;
  unitPrice: number;
  qty: number;
};

export class PricingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "PricingError";
    this.status = status;
  }
}

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function cleanSizes(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    const name = clean(key, 40);
    const option = clean(raw, 40);
    if (name && option) out[name] = option;
  }
  return out;
}

/**
 * Prices a bag from the catalog. Client prices, compare-at prices and shipping quotes are ignored.
 */
export function priceCart(rawItems: unknown): { items: PricedItem[]; subtotal: number; shipping: number; total: number } {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new PricingError("Your bag is empty.");
  if (rawItems.length > MAX_LINES) throw new PricingError("Too many items in your bag.");

  const merged = new Map<string, PricedItem>();
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") {
      throw new PricingError("Some items in your bag are no longer available. Please review your bag.", 409);
    }
    const row = raw as Record<string, unknown>;
    const product = getProduct(clean(row.slug, 80));
    const color = clean(row.color, 40);
    const sizes = cleanSizes(row.sizes);
    const qty = Math.floor(Number(row.qty));
    if (
      !product ||
      !Number.isFinite(product.price) ||
      product.price <= 0 ||
      !validateSelection(product, color, sizes) ||
      !Number.isFinite(qty) ||
      qty < 1 ||
      qty > MAX_LINE_QTY
    ) {
      throw new PricingError("Some items in your bag are no longer available. Please review your bag.", 409);
    }
    const size = sizeLabel(product, sizes);
    const key = `${product.slug}|${color}|${size}`;
    const nextQty = (merged.get(key)?.qty ?? 0) + qty;
    if (nextQty > MAX_LINE_QTY) {
      throw new PricingError("Some items in your bag are no longer available. Please review your bag.", 409);
    }
    const existing = merged.get(key);
    if (existing) existing.qty = nextQty;
    else {
      merged.set(key, {
        slug: product.slug,
        name: product.name,
        color,
        size,
        unitPrice: roundMoney(product.price),
        qty,
      });
    }
  }

  const items = [...merged.values()];
  const subtotalCents = items.reduce((sum, item) => sum + toCents(item.unitPrice) * item.qty, 0);
  const subtotal = subtotalCents / 100;
  const shipping = shippingFor(subtotal);
  const totalCents = subtotalCents + toCents(shipping);
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw new PricingError("We couldn't price this order.");
  return { items, subtotal, shipping, total: totalCents / 100 };
}

/** Recomputes the payable total from the stored lines. Returns null when the record is inconsistent. */
export function chargeCents(order: {
  items: { unitPrice: number; qty: number }[];
  subtotal: number;
  shipping: number;
  total: number;
}): number | null {
  if (!Array.isArray(order.items) || order.items.length === 0 || order.items.length > MAX_LINES) return null;
  let itemCents = 0;
  for (const item of order.items) {
    if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) return null;
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > MAX_LINE_QTY) return null;
    const unit = toCents(item.unitPrice);
    if (unit <= 0) return null;
    itemCents += unit * item.qty;
  }
  const subtotal = itemCents / 100;
  const shippingCents = toCents(shippingFor(subtotal));
  const totalCents = itemCents + shippingCents;
  if (itemCents !== toCents(order.subtotal)) return null;
  if (shippingCents !== toCents(order.shipping)) return null;
  if (totalCents !== toCents(order.total) || totalCents <= 0) return null;
  return totalCents;
}
