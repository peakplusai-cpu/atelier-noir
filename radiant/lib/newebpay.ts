import { createCipheriv, createDecipheriv, createHash, timingSafeEqual } from "crypto";
import type { PayMode, Settings } from "./types";

const GATEWAY: Record<PayMode, string> = {
  test: "https://ccore.newebpay.com/MPG/mpg_gateway",
  live: "https://core.newebpay.com/MPG/mpg_gateway",
};

export type PayConfig = {
  enabled: boolean;
  ready: boolean;
  mode: PayMode;
  merchantId: string;
  hashKey: string;
  hashIV: string;
  fromEnv: { merchantId: boolean; hashKey: boolean; hashIV: boolean; mode: boolean };
};

export function payConfig(settings: Settings): PayConfig {
  const envMode = process.env.NEWEBPAY_MODE === "live" ? "live" : process.env.NEWEBPAY_MODE === "test" ? "test" : "";
  const merchantId = (process.env.NEWEBPAY_MERCHANT_ID || settings.payMerchantId || "").trim();
  const hashKey = (process.env.NEWEBPAY_HASH_KEY || settings.payHashKey || "").trim();
  const hashIV = (process.env.NEWEBPAY_HASH_IV || settings.payHashIV || "").trim();
  const mode: PayMode = envMode || settings.payMode;
  const enabled = Boolean(settings.payOnlineEnabled);
  const ready = enabled && Boolean(merchantId) && hashKey.length === 32 && hashIV.length === 16;
  return {
    enabled,
    ready,
    mode: mode === "live" ? "live" : "test",
    merchantId,
    hashKey,
    hashIV,
    fromEnv: {
      merchantId: Boolean(process.env.NEWEBPAY_MERCHANT_ID),
      hashKey: Boolean(process.env.NEWEBPAY_HASH_KEY),
      hashIV: Boolean(process.env.NEWEBPAY_HASH_IV),
      mode: Boolean(envMode),
    },
  };
}

export function gatewayUrl(mode: PayMode): string {
  return GATEWAY[mode];
}

export function encryptTradeInfo(params: Record<string, string | number>, hashKey: string, hashIV: string): string {
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(hashKey, "utf8"), Buffer.from(hashIV, "utf8"));
  return Buffer.concat([cipher.update(query, "utf8"), cipher.final()]).toString("hex");
}

export function tradeSha(tradeInfo: string, hashKey: string, hashIV: string): string {
  return createHash("sha256").update(`HashKey=${hashKey}&${tradeInfo}&HashIV=${hashIV}`).digest("hex").toUpperCase();
}

function safeCompare(a: string, b: string): boolean {
  const x = Buffer.from(a.toUpperCase());
  const y = Buffer.from(b.toUpperCase());
  return x.length === y.length && timingSafeEqual(x, y);
}

// Responses are checked against both documented orderings of the key/iv wrapper;
// either one can only be produced by someone who knows the HashKey and HashIV.
export function verifyTradeSha(tradeInfo: string, sha: string, hashKey: string, hashIV: string): boolean {
  if (!tradeInfo || !sha) return false;
  const request = tradeSha(tradeInfo, hashKey, hashIV);
  const response = createHash("sha256")
    .update(`HashIV=${hashIV}&${tradeInfo}&HashKey=${hashKey}`)
    .digest("hex")
    .toUpperCase();
  return safeCompare(sha, request) || safeCompare(sha, response);
}

export function decryptTradeInfo(hex: string, hashKey: string, hashIV: string): string | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 32 !== 0) return null;
  try {
    const decipher = createDecipheriv("aes-256-cbc", Buffer.from(hashKey, "utf8"), Buffer.from(hashIV, "utf8"));
    decipher.setAutoPadding(false);
    const raw = Buffer.concat([decipher.update(Buffer.from(hex, "hex")), decipher.final()]);
    const pad = raw[raw.length - 1];
    if (pad < 1 || pad > 32 || pad > raw.length) return raw.toString("utf8");
    return raw.subarray(0, raw.length - pad).toString("utf8");
  } catch {
    return null;
  }
}

export type PayResult = {
  ok: boolean;
  status: string;
  message: string;
  merchantId: string;
  merchantOrderNo: string;
  amount: number;
  tradeNo: string;
  payType: string;
  payTime: string;
};

function str(v: unknown): string {
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

export function parsePayResult(decrypted: string): PayResult | null {
  let top: Record<string, unknown> = {};
  try {
    top = JSON.parse(decrypted) as Record<string, unknown>;
  } catch {
    top = Object.fromEntries(new URLSearchParams(decrypted));
  }
  if (!top || typeof top !== "object") return null;
  const inner = top.Result && typeof top.Result === "object" ? (top.Result as Record<string, unknown>) : top;
  const status = str(top.Status);
  const merchantOrderNo = str(inner.MerchantOrderNo);
  if (!status || !merchantOrderNo) return null;
  return {
    ok: status === "SUCCESS",
    status,
    message: str(top.Message),
    merchantId: str(inner.MerchantID),
    merchantOrderNo,
    amount: Number(inner.Amt),
    tradeNo: str(inner.TradeNo),
    payType: str(inner.PaymentType),
    payTime: str(inner.PayTime),
  };
}

export function orderCodeFromMerchantNo(merchantOrderNo: string): string {
  return merchantOrderNo.split("_")[0] ?? "";
}

export function merchantOrderNo(code: string, attempt: number): string {
  return `${code}_${attempt}`;
}

export type MpgForm = { action: string; fields: Record<string, string> };

export function buildMpgForm(args: {
  cfg: PayConfig;
  orderNo: string;
  amount: number;
  itemDesc: string;
  returnUrl: string;
  notifyUrl: string;
  clientBackUrl: string;
}): MpgForm {
  const { cfg } = args;
  const info = encryptTradeInfo(
    {
      MerchantID: cfg.merchantId,
      RespondType: "JSON",
      TimeStamp: Math.floor(Date.now() / 1000),
      Version: "2.0",
      LangType: "zh-tw",
      MerchantOrderNo: args.orderNo,
      Amt: Math.round(args.amount),
      ItemDesc: args.itemDesc.slice(0, 50),
      ReturnURL: args.returnUrl,
      NotifyURL: args.notifyUrl,
      ClientBackURL: args.clientBackUrl,
      EmailModify: 0,
      LoginType: 0,
      CREDIT: 1,
      APPLEPAY: 1,
    },
    cfg.hashKey,
    cfg.hashIV
  );
  return {
    action: gatewayUrl(cfg.mode),
    fields: {
      MerchantID: cfg.merchantId,
      TradeInfo: info,
      TradeSha: tradeSha(info, cfg.hashKey, cfg.hashIV),
      Version: "2.0",
      EncryptType: "0",
    },
  };
}

export const PAY_TYPE_LABEL: Record<string, string> = {
  CREDIT: "信用卡",
  APPLEPAY: "Apple Pay",
  ANDROIDPAY: "Google Pay",
  SAMSUNGPAY: "Samsung Pay",
  MANUAL: "員工手動確認",
};

export function payTypeLabel(type: string): string {
  return PAY_TYPE_LABEL[type] ?? (type || "線上付款");
}
