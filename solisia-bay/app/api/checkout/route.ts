import { apiJson } from "@/lib/api";
import { TAIWAN_CITIES } from "@/lib/taiwan";
import { clientIpFrom, originAllowed, readJson } from "@/lib/guard";
import { buildMpgForm, newebpayConfig } from "@/lib/newebpay";
import { createOrder, StorageError } from "@/lib/orders";
import { PricingError, wholeTwd, type PricedCart } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { reserveCheckout } from "@/lib/reserve";
import { releaseHold } from "@/lib/shop";

export const dynamic = "force-dynamic";

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function fail(error: string, status = 400) {
  return apiJson({ error }, status);
}

export async function POST(request: Request) {
  if (!originAllowed(request)) return fail("請求無效。", 403);
  if (!newebpayConfig()) return fail("付款功能尚未開通", 503);
  const limit = rateLimit(`checkout:${clientIpFrom(request.headers)}`, 8, 10 * 60 * 1000);
  if (!limit.ok) return fail("結帳次數太多，請稍後再試。", 429);

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (err) {
    const status = (err as { status?: number }).status === 413 ? 413 : 400;
    return fail(status === 413 ? "請求太大。" : "請求無效。", status);
  }
  if (!body || typeof body !== "object") return fail("請求無效。");
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

  address.country = "台灣";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("請輸入有效的電子郵件。");
  if (name.length < 2) return fail("請輸入姓名。");
  if (!/^09\d{8}$/.test(phone)) return fail("請輸入 09 開頭的手機號碼。");
  if (!TAIWAN_CITIES.includes(address.city as (typeof TAIWAN_CITIES)[number])) return fail("請選擇縣市。");
  if (address.state.length < 2) return fail("請填寫區。");
  if (!/^\d{3,6}$/.test(address.postalCode) || address.line1.length < 3) return fail("請完成收件地址。");

  const coupon = text(record.coupon, 40);
  let priced: PricedCart | null = null;
  try {
    priced = await reserveCheckout(record.items, coupon);
  } catch (err) {
    if (err instanceof PricingError) return fail(err.message, err.status);
    if (err instanceof StorageError) return fail("現在無法儲存訂單，請稍後再試。", 503);
    throw err;
  }
  if (!priced) return fail("無法計算這筆訂單。");
  const charged = wholeTwd(priced);
  if (charged.total < 1) {
    await releaseHold({ items: priced.items, promoId: priced.promoId, stockHeld: true }).catch(() => undefined);
    return fail("無法計算這筆訂單。");
  }

  let order;
  try {
    order = await createOrder({
      ...charged,
      email,
      name,
      phone,
      address,
      stockHeld: true,
      currency: "TWD",
      baseSubtotal: charged.subtotal,
      baseShipping: charged.shipping,
      baseDiscount: charged.discount,
      baseTotal: charged.total,
      displayCurrency: "TWD",
      displayTotal: charged.total,
      fxRate: 1,
    });
  } catch (err) {
    await releaseHold({ items: priced.items, promoId: priced.promoId, stockHeld: true }).catch((releaseErr) => {
      console.error("[checkout] could not return reserved stock", releaseErr);
    });
    if (err instanceof StorageError) {
      console.error("[checkout] storage error", err.message);
      return fail(err.message.includes("meta") ? err.message : "現在無法儲存訂單，請稍後再試。", 503);
    }
    throw err;
  }

  const config = newebpayConfig();
  if (!config) {
    await releaseHold(order).catch(() => undefined);
    return fail("付款功能尚未開通", 503);
  }
  const form = buildMpgForm({
    config,
    orderNo: order.code,
    amount: order.total,
    email: order.email,
    itemDesc: order.items.map((item) => item.name).join(", ") || "CLACK",
    timestamp: Math.floor(Date.now() / 1000),
  });
  return apiJson({ code: order.code, token: order.token, total: order.total, currency: "TWD", ...form });
}
