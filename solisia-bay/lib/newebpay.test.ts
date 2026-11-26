import assert from "node:assert/strict";
import test from "node:test";
import { decryptTradeInfo, encryptPlain, encryptTradeInfo, isNumberNotice, isPaidNotice, openTrade, parseTrade, tradeSha, tradeShaMatches } from "./newebpay.ts";

const key = "12345678901234567890123456789012";
const iv = "1234567890123456";
const sample = {
  MerchantID: 3430112,
  RespondType: "JSON",
  TimeStamp: 1485232229,
  Version: "1.4",
  MerchantOrderNo: "S_1485232229",
  Amt: 40,
  ItemDesc: "UnitTest",
};
const sampleInfo =
  "ff91c8aa01379e4de621a44e5f11f72e4d25bdb1a18242db6cef9ef07d80b0165e476fd1d9acaa53170272c82d122961e1a0700a7427cfa1cf90db7f6d6593bbc93102a4d4b9b66d9974c13c31a7ab4bba1d4e0790f0cbbbd7ad64c6d3c8012a601ceaa808bff70f94a8efa5a4f984b9d41304ffd879612177c622f75f4214fa";

test("AES TradeInfo matches the NewebPay manual sample", () => {
  assert.equal(encryptTradeInfo(sample, key, iv), sampleInfo);
  const plain = decryptTradeInfo(sampleInfo, key, iv);
  assert.match(plain, /MerchantOrderNo=S_1485232229/);
  assert.match(plain, /Amt=40/);
});

test("TradeSha is the uppercase SHA256 from the manual", () => {
  assert.equal(tradeSha(sampleInfo, key, iv), "EA0A6CC37F40C1EA5692E7CBB8AE097653DF3E91365E6A9CD7E91312413C7BB8");
  assert.equal(tradeShaMatches(sampleInfo, "ea0a6cc37f40c1ea5692e7cbb8ae097653df3e91365e6a9cd7e91312413c7bb8", key, iv), true);
  assert.equal(tradeShaMatches(sampleInfo, "00", key, iv), false);
});

test("a notify opens only with a matching TradeSha and distinguishes payment from a payment number", () => {
  const payload = JSON.stringify({
    Status: "SUCCESS",
    Message: "授權成功",
    Result: { MerchantOrderNo: "SB_261126_ABCDEF", Amt: 80, TradeNo: "T1", PaymentType: "CREDIT", PayTime: "2026-11-26 12:00:00" },
  });
  const info = encryptPlain(payload, key, iv);
  const opened = openTrade({ TradeInfo: info, TradeSha: tradeSha(info, key, iv) }, key, iv);
  assert.equal(opened?.amount, 80);
  assert.equal(opened && isPaidNotice(opened), true);
  assert.equal(openTrade({ TradeInfo: info, TradeSha: "AA" }, key, iv), null);
  const numberedPlain = JSON.stringify({
    Status: "SUCCESS",
    Message: "取號成功",
    Result: { MerchantOrderNo: "SB_261126_ABCDEF", Amt: 80, PaymentType: "VACC", BankCode: "008", CodeNo: "123456", ExpireDate: "2026-12-01" },
  });
  const numbered = parseTrade(numberedPlain);
  assert.ok(numbered);
  assert.equal(isPaidNotice(numbered), false);
  assert.equal(isNumberNotice(numbered), true);
  assert.equal(numbered.amount === 81, false);
});
