import { getProduct, validateSelection } from "./catalog";
import { MAX_LINE_QTY } from "./pricing";

export type CartLine = {
  key: string;
  slug: string;
  color: string;
  sizes: Record<string, string>;
  qty: number;
};

export function lineKey(slug: string, color: string, sizes: Record<string, string>): string {
  const sizePart = Object.keys(sizes)
    .sort()
    .map((key) => `${key}:${sizes[key]}`)
    .join(",");
  return `${slug}|${color}|${sizePart}`;
}

function cleanSizes(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw !== "string" || !key) return null;
    out[key] = raw;
  }
  return out;
}

export function finiteQty(value: unknown, fallback = 1): number | null {
  const qty = Math.floor(Number(value));
  if (!Number.isFinite(qty)) return fallback > 0 ? fallback : null;
  return qty;
}

/** Drops unknown products and invalid colour/size pairs. Merges duplicates and caps quantity. */
export function sanitizeCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, CartLine>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const line = item as Partial<CartLine>;
    if (typeof line.slug !== "string" || typeof line.color !== "string") continue;
    const product = getProduct(line.slug);
    const sizes = cleanSizes(line.sizes);
    if (!product || !sizes || !validateSelection(product, line.color, sizes)) continue;
    const qty = finiteQty(line.qty, 1);
    if (qty === null || qty < 1) continue;
    const key = lineKey(line.slug, line.color, sizes);
    const prev = merged.get(key);
    const next = Math.min(MAX_LINE_QTY, (prev?.qty ?? 0) + qty);
    if (prev) prev.qty = next;
    else merged.set(key, { key, slug: line.slug, color: line.color, sizes, qty: next });
  }
  return [...merged.values()];
}
