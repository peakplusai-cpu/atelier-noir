import { apiJson } from "@/lib/api";
import { clientIpFrom, originAllowed, readJson } from "@/lib/guard";
import { priceCart, PricingError, wholeTwd } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { getShop, publishedProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max) : "";
}

/** Estimates a total without reserving stock or consuming a coupon. */
export async function POST(request: Request) {
  if (!originAllowed(request)) return apiJson({ error: "請求無效。" }, 403);
  if (!rateLimit(`quote:${clientIpFrom(request.headers)}`, 30, 10 * 60 * 1000).ok) {
    return apiJson({ error: "請求太多，請稍後再試。" }, 429);
  }
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return apiJson({ error: "請求無效。" }, 400);
  }
  const record = (body ?? {}) as { items?: unknown; coupon?: unknown };
  try {
    const shop = await getShop();
    const priced = wholeTwd(priceCart(record.items, publishedProducts(shop), {
      coupon: text(record.coupon, 40),
      promotions: shop.promotions,
      threshold: shop.settings.freeShippingThreshold,
      flat: shop.settings.flatShipping,
    }));
    return apiJson({
      subtotal: priced.subtotal,
      discount: priced.discount,
      shipping: priced.shipping,
      total: priced.total,
      currency: "TWD",
      displayCurrency: "TWD",
      displayTotal: priced.total,
      chargeTotal: priced.total,
      coupon: priced.coupon,
      baseCurrency: "TWD",
      baseTotal: priced.total,
      fxRate: 1,
    });
  } catch (err) {
    if (err instanceof PricingError) return apiJson({ error: err.message }, err.status);
    return apiJson({ error: "無法估算這筆訂單。" }, 503);
  }
}
