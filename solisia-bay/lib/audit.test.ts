import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeCart } from "./cart-lines.ts";
import { originAllowed } from "./guard.ts";
import { centsToMoney, parseMoneyToCents, roundMoney, shippingFor, toCents } from "./money.ts";
import { canTransition } from "./order-status.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import { demoPaymentsAllowed } from "./payments.ts";
import { chargeCents, priceCart, PricingError } from "./pricing.ts";
import { rateLimit, resetRateLimits } from "./rate-limit.ts";
import { safeEqualString } from "./secret.ts";
import { createStaffToken, staffTokenValid } from "./session-token.ts";

const top = { slug: "calista-triangle-bikini-top", color: "Dune", sizes: { size: "S" }, qty: 1 };
const bottom = { slug: "calista-low-rise-bikini-bottom", color: "Dune", sizes: { size: "M" }, qty: 1 };

test("shipping thresholds and non-finite subtotals", () => {
  assert.equal(shippingFor(120), 0);
  assert.equal(shippingFor(119.99), 12);
  assert.equal(shippingFor(0), 0);
  assert.equal(shippingFor(-4), 0);
  assert.equal(shippingFor(Number.NaN), 0);
});

test("money helpers avoid binary cents drift", () => {
  assert.equal(toCents(68), 6800);
  assert.equal(roundMoney(68), 68);
  assert.equal(centsToMoney(8010), "80.10");
  assert.equal(centsToMoney(12), "0.12");
  assert.equal(parseMoneyToCents("80.10"), 8010);
  assert.equal(parseMoneyToCents("80.1"), 8010);
  assert.equal(parseMoneyToCents("80.001"), null);
  assert.equal(parseMoneyToCents("-1.00"), null);
});

test("catalog price is used and duplicate lines share the quantity cap", () => {
  const priced = priceCart([{ ...top, qty: 1, price: 1 }, { ...bottom, qty: 1, unitPrice: 0 }]);
  assert.equal(priced.subtotal, 130);
  assert.equal(priced.shipping, 0);
  assert.equal(priced.total, 130);
  assert.equal(priced.items[0].unitPrice, 68);
  assert.equal(chargeCents(priced), 13000);

  const single = priceCart([top]);
  assert.equal(single.subtotal, 68);
  assert.equal(single.shipping, 12);
  assert.equal(single.total, 80);
  assert.equal(chargeCents(single), 8000);
});

test("zero, fractional, oversized and unknown lines are rejected", () => {
  assert.throws(() => priceCart([{ ...top, qty: 0 }]), PricingError);
  assert.throws(() => priceCart([{ ...top, qty: -2 }]), PricingError);
  assert.equal(priceCart([{ ...top, qty: 1.9 }]).items[0].qty, 1);
  assert.throws(() => priceCart([{ ...top, qty: 11 }]), PricingError);
  assert.throws(() => priceCart([{ ...top, qty: 6 }, { ...top, qty: 6 }]), PricingError);
  assert.throws(() => priceCart([{ ...top, color: "Not a colour" }]), PricingError);
  assert.throws(() => priceCart([{ ...top, slug: "missing-product" }]), PricingError);
  assert.throws(() => priceCart([]), PricingError);
  const merged = priceCart([{ ...top, qty: 4 }, { ...top, qty: 3 }]);
  assert.equal(merged.items.length, 1);
  assert.equal(merged.items[0].qty, 7);
});

test("a tampered stored total does not match the charge", () => {
  const priced = priceCart([top]);
  assert.equal(chargeCents({ ...priced, shipping: 0, total: 68 }), null);
  assert.equal(chargeCents({ ...priced, total: 1 }), null);
});

test("cart storage drops invalid lines and caps duplicates", () => {
  const lines = sanitizeCart([
    { ...top, qty: 8 },
    { ...top, qty: 8 },
    { slug: "nope", color: "Dune", sizes: { size: "S" }, qty: 1 },
    { ...top, color: "Missing", qty: 2 },
    { ...bottom, qty: 1.8 },
  ]);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].qty, 10);
  assert.equal(lines[1].qty, 1);
});

test("order transitions cannot skip payment or unship", () => {
  assert.equal(canTransition("pending", "cancelled"), true);
  assert.equal(canTransition("pending", "paid"), false);
  assert.equal(canTransition("paid", "shipped"), true);
  assert.equal(canTransition("shipped", "cancelled"), false);
  assert.equal(canTransition("review", "shipped"), false);
  assert.equal(canTransition("review", "cancelled"), true);
  assert.equal(canTransition("cancelled", "paid"), false);
});

test("staff session dies when the password hash changes", () => {
  const token = createStaffToken("secret", "hash-a", 1_700_000_000_000);
  assert.equal(staffTokenValid(token, "secret", "hash-a", 1_700_000_000_000), true);
  assert.equal(staffTokenValid(token, "secret", "hash-b", 1_700_000_000_000), false);
  assert.equal(staffTokenValid(token, "other", "hash-a", 1_700_000_000_000), false);
  assert.equal(staffTokenValid(token, "secret", "hash-a", 1_700_000_000_000 + 31 * 24 * 60 * 60 * 1000), false);
  assert.equal(staffTokenValid("1.2.3", "secret", "hash-a"), false);
});

test("password hash verifies only the same password", async () => {
  const stored = await hashPassword("correct horse");
  assert.equal(await verifyPassword("correct horse", stored), true);
  assert.equal(await verifyPassword("wrong horse", stored), false);
  assert.equal(await verifyPassword("correct horse", "not-a-hash"), false);
});

test("rate limit and origin checks", () => {
  resetRateLimits();
  assert.equal(rateLimit("k", 2, 1_000, 10).ok, true);
  assert.equal(rateLimit("k", 2, 1_000, 20).ok, true);
  assert.equal(rateLimit("k", 2, 1_000, 30).ok, false);
  assert.equal(rateLimit("k", 2, 1_000, 2_000).ok, true);

  const same = new Request("https://shop.example/api/checkout", { headers: { origin: "https://shop.example", host: "shop.example" } });
  const cross = new Request("https://shop.example/api/checkout", { headers: { origin: "https://evil.example", host: "shop.example" } });
  const tool = new Request("https://shop.example/api/checkout", { headers: { host: "shop.example" } });
  assert.equal(originAllowed(same), true);
  assert.equal(originAllowed(cross), false);
  assert.equal(originAllowed(tool), true);
  assert.equal(safeEqualString("abc", "abc"), true);
  assert.equal(safeEqualString("abc", "abd"), false);
});

test("demo payments stay off when deployed", () => {
  const env = process.env as Record<string, string | undefined>;
  const prevNode = env.NODE_ENV;
  const prevVercel = env.VERCEL;
  env.NODE_ENV = "development";
  delete env.VERCEL;
  assert.equal(demoPaymentsAllowed(), true);
  env.VERCEL = "1";
  assert.equal(demoPaymentsAllowed(), false);
  env.NODE_ENV = "production";
  delete env.VERCEL;
  assert.equal(demoPaymentsAllowed(), false);
  env.NODE_ENV = prevNode;
  if (prevVercel === undefined) delete env.VERCEL;
  else env.VERCEL = prevVercel;
});
