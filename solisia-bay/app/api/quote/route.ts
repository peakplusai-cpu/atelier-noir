import { apiJson } from "@/lib/api";
import { getRates, settleCart } from "@/lib/fx";
import { clientIpFrom, originAllowed, readJson } from "@/lib/guard";
import { translateError } from "@/lib/i18n";
import { marketFromRequest } from "@/lib/market";
import { priceCart, PricingError } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { getShop, publishedProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max) : "";
}

/** Estimates a total without reserving stock or consuming a coupon. */
export async function POST(request: Request) {
  const market = marketFromRequest(request);
  const say = (message: string) => translateError(market.lang, message);
  if (!originAllowed(request)) return apiJson({ error: say("Invalid request.") }, 403);
  if (!rateLimit(`quote:${clientIpFrom(request.headers)}`, 30, 10 * 60 * 1000).ok) {
    return apiJson({ error: say("Too many requests.") }, 429);
  }
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return apiJson({ error: say("Invalid request.") }, 400);
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
    const settled = settleCart(priced, market.currency, await getRates());
    return apiJson({
      subtotal: settled.display.subtotal,
      discount: settled.display.discount,
      shipping: settled.display.shipping,
      total: settled.display.total,
      currency: settled.chargeCode,
      displayCurrency: settled.displayCode,
      displayTotal: settled.display.total,
      chargeTotal: settled.charge.total,
      coupon: priced.coupon,
      baseCurrency: "TWD",
      baseTotal: settled.base.total,
      fxRate: settled.fxRate,
    });
  } catch (err) {
    if (err instanceof PricingError) return apiJson({ error: say(err.message) }, err.status);
    return apiJson({ error: say("We couldn't estimate this order.") }, 503);
  }
}
