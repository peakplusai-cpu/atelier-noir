import { apiJson } from "@/lib/api";
import { COUNTRIES } from "@/lib/countries";
import { getRates, settleCart } from "@/lib/fx";
import { clientIpFrom, originAllowed, readJson } from "@/lib/guard";
import { localizedName, translateError } from "@/lib/i18n";
import { marketFromRequest } from "@/lib/market";
import { paypalConfigured } from "@/lib/paypal";
import { demoPaymentsAllowed } from "@/lib/payments";
import { toCents } from "@/lib/money";
import { createOrder, updateOrder, StorageError } from "@/lib/orders";
import { PricingError, type PricedCart } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { reserveCheckout } from "@/lib/reserve";
import { getShop, releaseHold } from "@/lib/shop";

export const dynamic = "force-dynamic";

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function fail(error: string, status = 400) {
  return apiJson({ error }, status);
}

export async function POST(request: Request) {
  const market = marketFromRequest(request);
  const say = (message: string) => translateError(market.lang, message);
  if (!originAllowed(request)) return fail(say("Invalid request."), 403);
  const limit = rateLimit(`checkout:${clientIpFrom(request.headers)}`, 8, 10 * 60 * 1000);
  if (!limit.ok) return fail(say("Too many checkout attempts. Please wait a few minutes and try again."), 429);

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (err) {
    const status = (err as { status?: number }).status === 413 ? 413 : 400;
    return fail(say(status === 413 ? "That request is too large." : "Invalid request."), status);
  }
  if (!body || typeof body !== "object") return fail(say("Invalid request."));
  const record = body as Record<string, unknown>;

  const email = text(record.email, 160).toLowerCase();
  const name = text(record.name, 100);
  const phone = text(record.phone, 40);
  const addr = (record.address ?? {}) as Record<string, unknown>;
  const address = {
    country: text(addr.country, 60),
    line1: text(addr.line1, 160),
    line2: text(addr.line2, 160),
    city: text(addr.city, 80),
    state: text(addr.state, 80),
    postalCode: text(addr.postalCode, 20),
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(say("Please enter a valid email address."));
  if (name.length < 2) return fail(say("Please enter your full name."));
  if (phone && !/^[0-9+().\-\s]{3,40}$/.test(phone)) return fail(say("Please enter a valid phone number."));
  if (!COUNTRIES.includes(address.country)) return fail(say("Please choose your country."));
  if (address.line1.length < 3 || address.city.length < 2 || address.postalCode.length < 2) {
    return fail(say("Please complete your shipping address."));
  }

  const coupon = text(record.coupon, 40);
  let priced: PricedCart | null = null;
  try {
    priced = await reserveCheckout(record.items, coupon);
  } catch (err) {
    if (err instanceof PricingError) return fail(say(err.message), err.status);
    if (err instanceof StorageError) return fail(say("We couldn't save your order right now. Please try again shortly."), 503);
    throw err;
  }
  if (!priced) return fail(say("We couldn't price this order."));

  const rates = await getRates();
  let settled;
  try {
    settled = settleCart(priced, market.currency, rates);
  } catch {
    await releaseHold({ items: priced.items, promoId: priced.promoId, stockHeld: true }).catch(() => undefined);
    return fail(say("We couldn't price this order."));
  }
  const shop = await getShop();
  const items = settled.charge.items.map((item) => {
    const product = shop.products.find((entry) => entry.slug === item.slug);
    return { ...item, name: product ? localizedName(product, market.lang) : item.name };
  });

  let order;
  try {
    order = await createOrder({
      ...settled.charge,
      items,
      email,
      name,
      phone,
      address,
      stockHeld: true,
      currency: settled.chargeCode,
      baseSubtotal: settled.base.subtotal,
      baseShipping: settled.base.shipping,
      baseDiscount: settled.base.discount,
      baseTotal: settled.base.total,
      displayCurrency: settled.displayCode,
      displayTotal: settled.display.total,
      fxRate: settled.fxRate,
    });
  } catch (err) {
    await releaseHold({ items: priced.items, promoId: priced.promoId, stockHeld: true }).catch((releaseErr) => {
      console.error("[checkout] could not return reserved stock", releaseErr);
    });
    if (err instanceof StorageError) {
      console.error("[checkout] storage error", err.message);
      return fail(err.message.includes("meta") ? err.message : say("We couldn't save your order right now. Please try again shortly."), 503);
    }
    throw err;
  }

  if (!paypalConfigured()) {
    if (!demoPaymentsAllowed()) {
      await releaseHold(order).catch((releaseErr) => console.error("[checkout] restock failed", releaseErr));
      await updateOrder(order.code, { status: "failed", stockHeld: false }, ["pending"]);
      return fail(say("Payments are not configured yet. Please try again later."), 503);
    }
    await updateOrder(
      order.code,
      { status: "paid", paymentOrderId: "demo", amountPaidCents: toCents(order.total), paidAt: new Date().toISOString() },
      ["pending"]
    );
    return apiJson({ code: order.code, token: order.token, demo: true });
  }

  return apiJson({
    code: order.code,
    token: order.token,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    currency: order.currency,
    coupon: order.coupon,
    displayCurrency: order.displayCurrency,
    displaySubtotal: settled.display.subtotal,
    displayDiscount: settled.display.discount,
    displayShipping: settled.display.shipping,
    displayTotal: settled.display.total,
    baseCurrency: "TWD",
    baseSubtotal: order.baseSubtotal,
    baseShipping: order.baseShipping,
    baseDiscount: order.baseDiscount,
    baseTotal: order.baseTotal,
    fxRate: order.fxRate,
  });
}
