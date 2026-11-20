import { getStore } from "./store";
import { decryptTradeInfo, parsePayResult, payConfig, verifyTradeSha } from "./newebpay";
import { recordPayment, type PaymentOutcome } from "./orders";

export type CallbackResult = { verified: false } | { verified: true; outcome: PaymentOutcome };

export async function processCallback(form: URLSearchParams): Promise<CallbackResult> {
  const tradeInfo = form.get("TradeInfo") ?? "";
  const sha = form.get("TradeSha") ?? "";
  const { settings } = await getStore();
  const cfg = payConfig(settings);
  if (!cfg.merchantId || cfg.hashKey.length !== 32 || cfg.hashIV.length !== 16) return { verified: false };
  if (!verifyTradeSha(tradeInfo, sha, cfg.hashKey, cfg.hashIV)) return { verified: false };
  const plain = decryptTradeInfo(tradeInfo, cfg.hashKey, cfg.hashIV);
  if (!plain) return { verified: false };
  const result = parsePayResult(plain);
  if (!result) return { verified: false };
  if (result.merchantId && result.merchantId !== cfg.merchantId) return { verified: false };
  return { verified: true, outcome: await recordPayment(result) };
}
