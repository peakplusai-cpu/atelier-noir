import assert from "node:assert/strict";
import test from "node:test";
import { FALLBACK_RATES, chargeCurrency, paypalAmount, paypalCaptureToCents } from "./currency.ts";
import { convertAmount, convertCart, settleCart } from "./fx.ts";
import { chargeCents, type PricedCart } from "./pricing.ts";

function cart(patch: Partial<PricedCart> = {}): PricedCart {
  return {
    items: [{ slug: "clack-box-tee", name: "Box Tee", color: "Black", size: "S", unitPrice: 68, qty: 1 }],
    subtotal: 68,
    shipping: 12,
    discount: 0,
    total: 80,
    coupon: "",
    promoId: "",
    shippingWaived: false,
    shipThreshold: 120,
    shipFlat: 12,
    ...patch,
  };
}

test("TWD stays a whole number and USD uses the fallback rate", () => {
  assert.equal(convertAmount(68, "TWD", FALLBACK_RATES), 68);
  assert.equal(convertAmount(68, "USD", FALLBACK_RATES), 2.06);
  assert.equal(convertAmount(68, "JPY", FALLBACK_RATES), 328);
  assert.equal(convertAmount(100, "KRW", {}), 4079);
  assert.equal(convertAmount(100, "USD", {}), Math.round(100 * FALLBACK_RATES.USD * 100) / 100);
});

test("converted carts still add up for PayPal", () => {
  for (const currency of ["TWD", "USD", "JPY", "HKD", "EUR"]) {
    const converted = convertCart(cart(), currency, FALLBACK_RATES);
    assert.equal(chargeCents(converted), Math.round(converted.total * 100));
    assert.equal(paypalAmount(chargeCents(converted)!, currency).includes("."), currency !== "TWD" && currency !== "JPY");
  }
  const hkd = paypalAmount(1050, "HKD");
  assert.equal(hkd, "10.50");
  assert.equal(paypalAmount(8000, "TWD"), "80");
  assert.equal(paypalCaptureToCents("80", "TWD"), 8000);
  assert.equal(paypalCaptureToCents("10.50", "HKD"), 1050);
});

test("a TWD percent discount charges a whole dollar", () => {
  const converted = convertCart(cart({ discount: 6.8, total: 73.2 }), "TWD", FALLBACK_RATES);
  assert.equal(converted.discount, 7);
  assert.equal(converted.total, 73);
  assert.equal(chargeCents(converted), 7300);
});

test("CNY and KRW are shown locally but charged in USD", () => {
  assert.equal(chargeCurrency("CNY"), "USD");
  assert.equal(chargeCurrency("KRW"), "USD");
  assert.equal(chargeCurrency("TWD"), "TWD");
  const settled = settleCart(cart(), "CNY", FALLBACK_RATES);
  assert.equal(settled.chargeCode, "USD");
  assert.equal(settled.displayCode, "CNY");
  assert.equal(settled.base.total, 80);
  assert.equal(settled.charge.total, 2.42);
  assert.ok(settled.display.total > settled.charge.total);
  assert.equal(settled.charge.items[0].unitPriceTwd, 68);
});
