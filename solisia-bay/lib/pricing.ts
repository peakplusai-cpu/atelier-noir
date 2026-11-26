import { products as seedProducts, sizeLabel, stockOf, validateSelection } from "./catalog";
import { roundMoney, shippingFor, toCents } from "./money";
import { quotePromotion, type Promotion } from "./promos";
import { SITE } from "./site";
import type { Gender, Product } from "./types";

export const MAX_LINE_QTY = 10;
export const MAX_LINES = 20;

export type PricedItem = {
  slug: string;
  name: string;
  color: string;
  size: string;
  unitPrice: number;
  /** Catalog price in TWD, kept after the line is converted for checkout. */
  unitPriceTwd?: number;
  qty: number;
  gender?: Gender;
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

export type PricedCart = {
  items: PricedItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  coupon: string;
  promoId: string;
  shippingWaived: boolean;
  shipThreshold: number;
  shipFlat: number;
};

/**
 * Prices a bag from the supplied catalog. Client prices are ignored.
 * The default catalog is the built-in seed, which is not stock-tracked.
 */
export function priceCart(
  rawItems: unknown,
  catalog: Product[] = seedProducts,
  options?: { coupon?: string; promotions?: Promotion[]; threshold?: number; flat?: number; now?: number }
): PricedCart {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new PricingError("Your bag is empty.");
  if (rawItems.length > MAX_LINES) throw new PricingError("Too many items in your bag.");

  const merged = new Map<string, PricedItem>();
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") {
      throw new PricingError("Some items in your bag are no longer available. Please review your bag.", 409);
    }
    const row = raw as Record<string, unknown>;
    const product = catalog.find((item) => item.slug === clean(row.slug, 80));
    const color = clean(row.color, 40);
    const sizes = cleanSizes(row.sizes);
    const qty = Math.floor(Number(row.qty));
    if (
      !product ||
      !Number.isFinite(product.price) ||
      product.price <= 0 ||
      (product.status ?? "published") === "draft" ||
      !validateSelection(product, color, sizes) ||
      !Number.isFinite(qty) ||
      qty < 1 ||
      qty > MAX_LINE_QTY
    ) {
      throw new PricingError("Some items in your bag are no longer available. Please review your bag.", 409);
    }
    const size = sizeLabel(product, sizes);
    const available = stockOf(product, color, size);
    const key = `${product.slug}|${color}|${size}`;
    const nextQty = (merged.get(key)?.qty ?? 0) + qty;
    if (available !== null && nextQty > available) {
      throw new PricingError("Some pieces don't have enough stock. Please review your bag.", 409);
    }
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
        gender: product.gender,
      });
    }
  }

  const items = [...merged.values()];
  const subtotalCents = items.reduce((sum, item) => sum + toCents(item.unitPrice) * item.qty, 0);
  const subtotal = subtotalCents / 100;
  const shipThreshold = options?.threshold ?? SITE.freeShippingThreshold;
  const shipFlat = options?.flat ?? SITE.flatShipping;
  const quoted = quotePromotion({
    items,
    subtotal,
    promotions: options?.promotions ?? [],
    coupon: options?.coupon,
    now: options?.now,
  });
  if ("error" in quoted) throw new PricingError(quoted.error);
  let discountCents = toCents(quoted.discount);
  const shipping = quoted.freeShipping ? 0 : shippingFor(subtotal, { threshold: shipThreshold, flat: shipFlat });
  if (discountCents > subtotalCents) discountCents = subtotalCents;
  const totalCents = subtotalCents - discountCents + toCents(shipping);
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw new PricingError("We couldn't price this order.");
  return {
    items,
    subtotal,
    shipping,
    discount: discountCents / 100,
    total: totalCents / 100,
    coupon: quoted.coupon,
    promoId: quoted.promoId,
    shippingWaived: quoted.freeShipping,
    shipThreshold,
    shipFlat,
  };
}

/** NewebPay charges whole TWD. Round the priced cart without trusting a client total. */
export function wholeTwd(cart: PricedCart): PricedCart {
  const items = cart.items.map((item) => ({
    ...item,
    unitPrice: Math.round(item.unitPrice),
    unitPriceTwd: Math.round(item.unitPriceTwd ?? item.unitPrice),
  }));
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const shipThreshold = Math.round(cart.shipThreshold);
  const shipFlat = Math.round(cart.shipFlat);
  const shipping = cart.shippingWaived ? 0 : shippingFor(subtotal, { threshold: shipThreshold, flat: shipFlat });
  const discount = Math.min(subtotal, Math.round(cart.discount));
  const total = subtotal - discount + shipping;
  return { ...cart, items, subtotal, shipping, discount, total, shipThreshold, shipFlat };
}

/** Recomputes the payable total from the stored lines. Returns null when the record is inconsistent. */
export function chargeCents(order: {
  items: { unitPrice: number; qty: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  discount?: number;
  shippingWaived?: boolean;
  shipThreshold?: number;
  shipFlat?: number;
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
  const discount = toCents(order.discount ?? 0);
  if (discount < 0 || discount > itemCents) return null;
  const shippingCents = toCents(
    order.shippingWaived
      ? 0
      : shippingFor(subtotal, { threshold: order.shipThreshold, flat: order.shipFlat })
  );
  const totalCents = itemCents - discount + shippingCents;
  if (itemCents !== toCents(order.subtotal)) return null;
  if (shippingCents !== toCents(order.shipping)) return null;
  if (totalCents !== toCents(order.total) || totalCents <= 0) return null;
  return totalCents;
}
