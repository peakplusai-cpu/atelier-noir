import assert from "node:assert/strict";
import test from "node:test";
import { chargeCurrency } from "./currency.ts";
import { currencyFor, languageFor, marketFromRequest, resolveMarket } from "./market.ts";

test("missing geo defaults to Traditional Chinese and TWD", () => {
  const market = resolveMarket(null, null);
  assert.equal(market.country, "TW");
  assert.equal(market.lang, "zh");
  assert.equal(market.currency, "TWD");
  assert.equal(resolveMarket("", "nope").lang, "zh");
});

test("China defaults to Traditional Chinese and CNY, Taiwan stays TWD", () => {
  assert.deepEqual(resolveMarket("CN", null), { country: "CN", lang: "zh", currency: "CNY" });
  assert.deepEqual(resolveMarket("cn", null), { country: "CN", lang: "zh", currency: "CNY" });
  assert.equal(chargeCurrency(resolveMarket("CN", null).currency), "USD");
  assert.deepEqual(resolveMarket("TW", null), { country: "TW", lang: "zh", currency: "TWD" });
  assert.equal(chargeCurrency(resolveMarket("TW", null).currency), "TWD");
  const request = new Request("https://solisiabay.vercel.app/api/quote", {
    headers: { "x-vercel-ip-country": "CN" },
  });
  const market = marketFromRequest(request);
  assert.equal(market.lang, "zh");
  assert.equal(market.currency, "CNY");
});

test("country picks language and currency", () => {
  assert.equal(languageFor("CN"), "zh");
  assert.equal(currencyFor("CN"), "CNY");
  assert.deepEqual(resolveMarket("us", null), { country: "US", lang: "en", currency: "USD" });
  assert.equal(resolveMarket("JP", null).currency, "JPY");
  assert.equal(resolveMarket("HK", null).currency, "HKD");
  assert.equal(resolveMarket("KR", null).currency, "KRW");
  assert.equal(resolveMarket("GB", null).currency, "GBP");
  assert.equal(resolveMarket("AU", null).currency, "AUD");
  assert.equal(resolveMarket("CA", null).currency, "CAD");
  assert.equal(resolveMarket("SG", null).currency, "SGD");
  assert.equal(resolveMarket("DE", null).currency, "EUR");
  assert.equal(resolveMarket("FR", null).lang, "en");
  assert.equal(resolveMarket("BR", null).currency, "USD");
});

test("a preference cookie overrides the IP country", () => {
  const market = resolveMarket("TW", "en.USD");
  assert.equal(market.lang, "en");
  assert.equal(market.currency, "USD");
  assert.equal(market.country, "TW");
  assert.equal(resolveMarket("US", "zh.TWD").lang, "zh");
  assert.equal(resolveMarket("US", "zh.NOK").currency, "USD");
});

test("request cookies and the geo header are the only inputs", () => {
  const request = new Request("http://localhost/api/checkout", {
    headers: { cookie: "clack_pref=en.EUR", "x-vercel-ip-country": "TW", "x-clack-currency": "JPY" },
  });
  const market = marketFromRequest(request);
  assert.equal(market.lang, "en");
  assert.equal(market.currency, "EUR");
});
