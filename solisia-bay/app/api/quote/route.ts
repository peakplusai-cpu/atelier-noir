import { apiJson } from "@/lib/api";
import { clientIpFrom, originAllowed, readJson } from "@/lib/guard";
import { priceCart, PricingError } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { getShop, publishedProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max) : "";
}

/** Estimates a total without reserving stock or consuming a coupon. */
export async function POST(request: Request) {
  if (!originAllowed(request)) return apiJson({ error: "Invalid request." }, 403);
  if (!rateLimit(`quote:${clientIpFrom(request.headers)}`, 30, 10 * 60 * 1000).ok) {
    return apiJson({ error: "Too many requests." }, 429);
  }
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return apiJson({ error: "Invalid request." }, 400);
  }
  const record = (body ?? {}) as { items?: unknown; coupon?: unknown };
  try {
    const shop = await getShop();
    const priced = priceCart(record.items, publishedProducts(shop), {
      coupon: text(record.coupon, 40),
      promotions: shop.promotions,
      threshold: shop.settings.freeShippingThreshold,
      flat: shop.settings.flatShipping,
    });
    return apiJson({
      subtotal: priced.subtotal,
      discount: priced.discount,
      shipping: priced.shipping,
      total: priced.total,
      coupon: priced.coupon,
    });
  } catch (err) {
    if (err instanceof PricingError) return apiJson({ error: err.message }, err.status);
    return apiJson({ error: "We couldn't estimate this order." }, 503);
  }
}
