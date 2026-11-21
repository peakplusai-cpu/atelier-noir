import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { before, test } from "node:test";
import type { PricedCart, PricingError } from "./pricing.ts";

const dir = mkdtempSync(join(tmpdir(), "solisia-shop-"));
process.env.SOLISIA_SHOP_FILE = join(dir, "shop.json");
process.env.SOLISIA_DATA_FILE = join(dir, "orders.json");
process.env.SUPABASE_URL = "";
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

type ShopApi = {
  reserveCheckout: (raw: unknown, coupon?: string) => Promise<PricedCart>;
  getShop: () => Promise<{ products: { slug: string; inventory?: Record<string, number> }[]; promotions: { id: string; used: number }[] }>;
  mutateShop: (fn: (shop: { products: { slug: string; inventory?: Record<string, number> }[]; promotions: unknown[] }) => void) => Promise<void>;
  releaseHold: (order: { items: PricedCart["items"]; promoId?: string; stockHeld?: boolean }) => Promise<void>;
  PricingError: typeof PricingError;
};

let api: ShopApi;

before(async () => {
  const reserve = await import("./reserve.ts");
  const shop = await import("./shop.ts");
  const pricing = await import("./pricing.ts");
  api = {
    reserveCheckout: reserve.reserveCheckout,
    getShop: shop.getShop,
    mutateShop: shop.mutateShop as ShopApi["mutateShop"],
    releaseHold: shop.releaseHold,
    PricingError: pricing.PricingError,
  };
});

const line = { slug: "clack-box-tee", color: "Black", sizes: { size: "S" }, qty: 1, price: 1 };

test("reserve ignores client price, holds stock, and releases it", async () => {
  const beforeShop = (await api.getShop()).products.find((item) => item.slug === line.slug)!;
  const start = beforeShop.inventory?.["Black|S"] ?? 0;
  const priced = await api.reserveCheckout([{ ...line, qty: 2 }], "");
  assert.equal(priced.items[0].unitPrice, 68);
  assert.equal(priced.items[0].qty, 2);
  const held = (await api.getShop()).products.find((item) => item.slug === line.slug)!;
  assert.equal(held.inventory?.["Black|S"], start - 2);
  await api.releaseHold({ items: priced.items, promoId: priced.promoId, stockHeld: true });
  const after = (await api.getShop()).products.find((item) => item.slug === line.slug)!;
  assert.equal(after.inventory?.["Black|S"], start);
});

test("two reservations cannot oversell the last unit", async () => {
  await api.mutateShop((shop) => {
    const product = shop.products.find((item) => item.slug === line.slug);
    if (product?.inventory) product.inventory["Black|S"] = 1;
  });
  const results = await Promise.allSettled([api.reserveCheckout([line], ""), api.reserveCheckout([line], "")]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  assert.equal((await api.getShop()).products.find((item) => item.slug === line.slug)?.inventory?.["Black|S"], 0);
});

test("a coupon cannot be reused past its limit", async () => {
  await api.mutateShop((shop) => {
    const product = shop.products.find((item) => item.slug === line.slug);
    if (product?.inventory) product.inventory["Black|S"] = 5;
    shop.promotions.push({
      id: "prm_once",
      name: "Once",
      code: "ONCE",
      enabled: true,
      kind: "amount",
      value: 5,
      minSubtotal: 0,
      scope: "all",
      gender: "",
      slug: "",
      startsAt: "2020-01-01T00:00:00.000Z",
      endsAt: "2099-01-01T00:00:00.000Z",
      usageLimit: 1,
      used: 0,
      createdAt: "2020-01-01T00:00:00.000Z",
    });
  });
  const first = await api.reserveCheckout([line], "once");
  assert.equal(first.discount, 5);
  await assert.rejects(api.reserveCheckout([line], "ONCE"), (err: unknown) => err instanceof api.PricingError);
  assert.equal((await api.getShop()).promotions.find((promo) => promo.id === "prm_once")?.used, 1);
});

test("cleanup shop fixture", () => {
  rmSync(dir, { recursive: true, force: true });
});
