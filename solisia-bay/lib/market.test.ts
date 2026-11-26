import assert from "node:assert/strict";
import test from "node:test";
import { marketFromRequest, resolveMarket } from "./market.ts";

test("missing geo defaults to Traditional Chinese and TWD", () => {
  const market = resolveMarket(null, null);
  assert.equal(market.country, "TW");
  assert.equal(market.lang, "zh");
  assert.equal(market.currency, "TWD");
  assert.equal(resolveMarket("", "nope").lang, "zh");
});

test("the shop stays Traditional Chinese and TWD for every country and cookie", () => {
  assert.deepEqual(resolveMarket("CN", null), { country: "TW", lang: "zh", currency: "TWD" });
  assert.deepEqual(resolveMarket("US", "en.USD"), { country: "TW", lang: "zh", currency: "TWD" });
  assert.deepEqual(resolveMarket(null, "zh.CNY"), { country: "TW", lang: "zh", currency: "TWD" });
  const request = new Request("https://solisiabay.vercel.app/", {
    headers: { "x-vercel-ip-country": "US", cookie: "clack_pref=en.USD" },
  });
  assert.deepEqual(marketFromRequest(request), { country: "TW", lang: "zh", currency: "TWD" });
});

