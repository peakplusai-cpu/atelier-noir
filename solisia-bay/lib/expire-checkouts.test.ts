import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { before, test } from "node:test";
import { cronAuthStatus } from "./cron-auth.ts";
import type { PayPalView } from "./paypal.ts";

const dir = mkdtempSync(join(tmpdir(), "solisia-expire-"));
process.env.SOLISIA_DATA_FILE = join(dir, "orders.json");
process.env.SOLISIA_SHOP_FILE = join(dir, "shop.json");
process.env.SUPABASE_URL = "";
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

type ShopSnap = { products: { slug: string; inventory?: Record<string, number> }[]; promotions: { id: string; used: number }[] };

type ExpireApi = {
  expireAbandonedCheckouts: (options?: {
    now?: number;
    inspect?: (id: string) => Promise<PayPalView>;
    inspectTimeoutMs?: number;
  }) => Promise<{ cancelled: string[]; kept: string[] }>;
  loadPublicShop: () => Promise<ShopSnap>;
  reserveCheckout: (raw: unknown, coupon?: string) => Promise<{ items: { slug: string; color: string; size: string; qty: number }[]; promoId: string; subtotal: number; shipping: number; discount: number; total: number; coupon: string; shippingWaived: boolean; shipThreshold: number; shipFlat: number }>;
  createOrder: (input: Record<string, unknown>) => Promise<{ code: string }>;
  getOrder: (code: string) => Promise<{ status: string; stockHeld: boolean } | null>;
  getShop: () => Promise<ShopSnap>;
  mutateShop: (fn: (shop: ShopSnap) => void) => Promise<void>;
};

let api: ExpireApi;
const line = { slug: "calista-triangle-bikini-top", color: "Dune", sizes: { size: "S" }, qty: 1, price: 1 };

before(async () => {
  const expire = await import("./expire-checkouts.ts");
  const reserve = await import("./reserve.ts");
  const orders = await import("./orders.ts");
  const shop = await import("./shop.ts");
  api = {
    expireAbandonedCheckouts: expire.expireAbandonedCheckouts,
    loadPublicShop: expire.loadPublicShop,
    reserveCheckout: reserve.reserveCheckout,
    createOrder: orders.createOrder as ExpireApi["createOrder"],
    getOrder: orders.getOrder,
    getShop: shop.getShop,
    mutateShop: shop.mutateShop as ExpireApi["mutateShop"],
  };
});

function age(code: string, minutes: number) {
  const file = process.env.SOLISIA_DATA_FILE!;
  const orders = JSON.parse(readFileSync(file, "utf8")) as { code: string; createdAt: string }[];
  const order = orders.find((item) => item.code === code);
  if (!order) throw new Error("missing order");
  order.createdAt = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  writeFileSync(file, JSON.stringify(orders));
}

async function holdOrder() {
  const priced = await api.reserveCheckout([line], "");
  const order = await api.createOrder({
    ...priced,
    email: "a@b.co",
    name: "Ann Lee",
    phone: "",
    address: { country: "Taiwan", line1: "1 Road Street", line2: "", city: "Taipei", state: "", postalCode: "100" },
    stockHeld: true,
  });
  return order.code;
}

test("cron bearer check requires a configured secret", () => {
  assert.equal(cronAuthStatus("Bearer short-secret", "short-secret"), "unconfigured");
  assert.equal(cronAuthStatus(null, "a-long-enough-secret"), "rejected");
  assert.equal(cronAuthStatus("Bearer wrong-secret-value", "a-long-enough-secret"), "rejected");
  assert.equal(cronAuthStatus("Bearer a-long-enough-secret", "a-long-enough-secret"), "ok");
});

test("a pending checkout older than 45 minutes returns stock once", async () => {
  const code = await holdOrder();
  const before = (await api.getShop()).products.find((item) => item.slug === line.slug)?.inventory?.["Dune|S"] ?? 0;
  age(code, 10);
  const fresh = await api.expireAbandonedCheckouts({ inspect: async () => ({ kind: "open" }) });
  assert.equal(fresh.cancelled.includes(code), false);
  age(code, 46);
  const first = await api.expireAbandonedCheckouts({ inspect: async () => ({ kind: "open" }) });
  assert.deepEqual(first.cancelled, [code]);
  assert.equal((await api.getOrder(code))?.status, "cancelled");
  assert.equal((await api.getOrder(code))?.stockHeld, false);
  assert.equal((await api.getShop()).products.find((item) => item.slug === line.slug)?.inventory?.["Dune|S"], before + 1);
  const second = await api.expireAbandonedCheckouts({ inspect: async () => ({ kind: "open" }) });
  assert.equal(second.cancelled.includes(code), false);
  assert.equal((await api.getShop()).products.find((item) => item.slug === line.slug)?.inventory?.["Dune|S"], before + 1);
});

test("a captured PayPal order is not cancelled", async () => {
  const code = await holdOrder();
  age(code, 50);
  const orders = JSON.parse(readFileSync(process.env.SOLISIA_DATA_FILE!, "utf8")) as { code: string; paymentOrderId: string | null }[];
  const row = orders.find((item) => item.code === code);
  if (!row) throw new Error("missing");
  row.paymentOrderId = "PAYPALORDER123";
  writeFileSync(process.env.SOLISIA_DATA_FILE!, JSON.stringify(orders));
  const stock = (await api.getShop()).products.find((item) => item.slug === line.slug)?.inventory?.["Dune|S"];
  const result = await api.expireAbandonedCheckouts({
    inspect: async () => ({ kind: "captured", capture: null }),
  });
  assert.equal(result.kept.includes(code), true);
  assert.equal(result.cancelled.includes(code), false);
  assert.equal((await api.getOrder(code))?.status, "pending");
  assert.equal((await api.getShop()).products.find((item) => item.slug === line.slug)?.inventory?.["Dune|S"], stock);
});

test("an unknown PayPal status keeps the reservation", async () => {
  const code = await holdOrder();
  age(code, 50);
  const orders = JSON.parse(readFileSync(process.env.SOLISIA_DATA_FILE!, "utf8")) as { code: string; paymentOrderId: string | null }[];
  orders.find((item) => item.code === code)!.paymentOrderId = "PAYPALORDER456";
  writeFileSync(process.env.SOLISIA_DATA_FILE!, JSON.stringify(orders));
  const result = await api.expireAbandonedCheckouts({ inspect: async () => ({ kind: "unknown" }) });
  assert.equal(result.kept.includes(code), true);
  assert.equal((await api.getOrder(code))?.status, "pending");
  assert.equal((await api.getOrder(code))?.stockHeld, true);
});

test("a hold with no PayPal id is released without a status lookup", async () => {
  await api.expireAbandonedCheckouts({ inspect: async () => ({ kind: "open" }) });
  const code = await holdOrder();
  age(code, 46);
  let calls = 0;
  const result = await api.expireAbandonedCheckouts({
    inspect: async () => {
      calls += 1;
      return { kind: "open" };
    },
  });
  assert.equal(calls, 0);
  assert.deepEqual(result.cancelled, [code]);
});

test("a PayPal id is checked, and a slow check does not cancel the hold", async () => {
  await api.expireAbandonedCheckouts({ inspect: async () => ({ kind: "open" }) });
  const code = await holdOrder();
  age(code, 50);
  const orders = JSON.parse(readFileSync(process.env.SOLISIA_DATA_FILE!, "utf8")) as { code: string; paymentOrderId: string | null }[];
  orders.find((item) => item.code === code)!.paymentOrderId = "PAYPALORDER789";
  writeFileSync(process.env.SOLISIA_DATA_FILE!, JSON.stringify(orders));
  let calls = 0;
  const started = Date.now();
  const result = await api.expireAbandonedCheckouts({
    inspectTimeoutMs: 40,
    inspect: () => {
      calls += 1;
      return new Promise(() => undefined);
    },
  });
  assert.equal(calls, 1);
  assert.ok(Date.now() - started < 1000);
  assert.equal(result.kept.includes(code), true);
  assert.equal((await api.getOrder(code))?.status, "pending");
  assert.equal((await api.getOrder(code))?.stockHeld, true);
});

test("checkout and the public catalog release a hold older than 45 minutes first", async () => {
  await api.mutateShop((shop) => {
    const product = shop.products.find((item) => item.slug === line.slug);
    if (product?.inventory) product.inventory["Dune|S"] = 1;
  });
  const code = await holdOrder();
  assert.equal((await api.getShop()).products.find((item) => item.slug === line.slug)?.inventory?.["Dune|S"], 0);
  age(code, 46);
  const shown = await api.loadPublicShop();
  assert.equal(shown.products.find((item) => item.slug === line.slug)?.inventory?.["Dune|S"], 1);
  assert.equal((await api.getOrder(code))?.status, "cancelled");
  await api.mutateShop((shop) => {
    const product = shop.products.find((item) => item.slug === line.slug);
    if (product?.inventory) product.inventory["Dune|S"] = 0;
  });
  const held = JSON.parse(readFileSync(process.env.SOLISIA_DATA_FILE!, "utf8")) as { code: string; status: string; createdAt: string; stockHeld: boolean }[];
  const row = held.find((item) => item.code === code);
  if (!row) throw new Error("missing");
  row.status = "pending";
  row.stockHeld = true;
  row.createdAt = new Date(Date.now() - 46 * 60 * 1000).toISOString();
  writeFileSync(process.env.SOLISIA_DATA_FILE!, JSON.stringify(held));
  const again = await api.reserveCheckout([line], "");
  assert.equal(again.items[0]?.qty, 1);
  assert.equal((await api.getOrder(code))?.status, "cancelled");
  assert.equal((await api.getShop()).products.find((item) => item.slug === line.slug)?.inventory?.["Dune|S"], 0);
});

test("cleanup expire fixture", () => {
  rmSync(dir, { recursive: true, force: true });
});
