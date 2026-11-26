import { createCipheriv, createDecipheriv, createHash } from "crypto";
import { siteOrigin } from "./site";

const SANDBOX = "https://ccore.newebpay.com/MPG/mpg_gateway";
const LIVE = "https://core.newebpay.com/MPG/mpg_gateway";

export type NewebPayConfig = {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  env: "sandbox" | "production";
};

export function newebpayConfig(): NewebPayConfig | null {
  const merchantId = process.env.NEWEBPAY_MERCHANT_ID?.trim() ?? "";
  const hashKey = process.env.NEWEBPAY_HASH_KEY?.trim() ?? "";
  const hashIv = process.env.NEWEBPAY_HASH_IV?.trim() ?? "";
  const env = (process.env.NEWEBPAY_ENV ?? "").trim().toLowerCase();
  if (!merchantId || hashKey.length !== 32 || hashIv.length !== 16) return null;
  if (env !== "sandbox" && env !== "production") return null;
  return { merchantId, hashKey, hashIv, env };
}

export function newebpayConfigured(): boolean {
  return newebpayConfig() !== null;
}

export function gatewayUrl(env: NewebPayConfig["env"]): string {
  return env === "production" ? LIVE : SANDBOX;
}

/** NewebPay's sample pads to 32 bytes, then AES-256-CBC with an empty OpenSSL padding. */
function pad32(value: Buffer): Buffer {
  const pad = 32 - (value.length % 32);
  return Buffer.concat([value, Buffer.alloc(pad, pad)]);
}

function unpad32(value: Buffer): Buffer {
  const pad = value[value.length - 1] ?? 0;
  if (pad < 1 || pad > 32) return value;
  for (let i = 0; i < pad; i++) {
    if (value[value.length - 1 - i] !== pad) return value;
  }
  return value.subarray(0, value.length - pad);
}

export function queryString(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value)).replace(/%20/g, "+")}`)
    .join("&");
}

export function encryptPlain(plain: string, hashKey: string, hashIv: string): string {
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(hashKey), Buffer.from(hashIv));
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(pad32(Buffer.from(plain, "utf8"))), cipher.final()]).toString("hex");
}

export function encryptTradeInfo(params: Record<string, string | number>, hashKey: string, hashIv: string): string {
  return encryptPlain(queryString(params), hashKey, hashIv);
}

export function decryptTradeInfo(tradeInfo: string, hashKey: string, hashIv: string): string {
  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(hashKey), Buffer.from(hashIv));
  decipher.setAutoPadding(false);
  const plain = Buffer.concat([decipher.update(Buffer.from(tradeInfo, "hex")), decipher.final()]);
  return unpad32(plain).toString("utf8");
}

export function tradeSha(tradeInfo: string, hashKey: string, hashIv: string): string {
  return createHash("sha256").update(`HashKey=${hashKey}&${tradeInfo}&HashIV=${hashIv}`).digest("hex").toUpperCase();
}

export function tradeShaMatches(tradeInfo: string, claimed: string, hashKey: string, hashIv: string): boolean {
  const expected = tradeSha(tradeInfo, hashKey, hashIv);
  return expected.length === claimed.length && expected === claimed.toUpperCase();
}

export type GatewayForm = {
  action: string;
  fields: { MerchantID: string; TradeInfo: string; TradeSha: string; Version: "2.0" };
};

export function buildMpgForm(input: {
  config: NewebPayConfig;
  orderNo: string;
  amount: number;
  email: string;
  itemDesc: string;
  timestamp: number;
}): GatewayForm {
  const origin = siteOrigin();
  const params: Record<string, string | number> = {
    MerchantID: input.config.merchantId,
    RespondType: "JSON",
    TimeStamp: input.timestamp,
    Version: "2.0",
    LangType: "zh-tw",
    MerchantOrderNo: input.orderNo,
    Amt: input.amount,
    ItemDesc: input.itemDesc.slice(0, 50),
    Email: input.email,
    LoginType: 0,
    CREDIT: 1,
    VACC: 1,
    CVS: 1,
    ReturnURL: `${origin}/api/pay/return`,
    NotifyURL: `${origin}/api/pay/notify`,
    CustomerURL: `${origin}/api/pay/customer`,
    ClientBackURL: `${origin}/checkout`,
  };
  const tradeInfo = encryptTradeInfo(params, input.config.hashKey, input.config.hashIv);
  return {
    action: gatewayUrl(input.config.env),
    fields: {
      MerchantID: input.config.merchantId,
      TradeInfo: tradeInfo,
      TradeSha: tradeSha(tradeInfo, input.config.hashKey, input.config.hashIv),
      Version: "2.0",
    },
  };
}

export type ParsedTrade = {
  status: string;
  message: string;
  orderNo: string;
  amount: number;
  paymentType: string;
  tradeNo: string;
  payTime: string;
  bankCode: string;
  codeNo: string;
  expireDate: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function parseTrade(plain: string): ParsedTrade | null {
  let data: Record<string, unknown>;
  try {
    data = plain.trim().startsWith("{") ? asRecord(JSON.parse(plain)) : Object.fromEntries(new URLSearchParams(plain));
  } catch {
    return null;
  }
  const result = asRecord(data.Result);
  const source = Object.keys(result).length ? result : data;
  const orderNo = text(source.MerchantOrderNo);
  const amount = Number(source.Amt);
  if (!orderNo || !Number.isFinite(amount)) return null;
  return {
    status: text(data.Status || source.Status),
    message: text(data.Message || source.Message),
    orderNo,
    amount,
    paymentType: text(source.PaymentType),
    tradeNo: text(source.TradeNo),
    payTime: text(source.PayTime),
    bankCode: text(source.BankCode),
    codeNo: text(source.CodeNo),
    expireDate: text(source.ExpireDate),
  };
}

/** A number issued for ATM or a convenience-store code is not a completed payment. */
export function isPaidNotice(trade: ParsedTrade): boolean {
  if (trade.status !== "SUCCESS") return false;
  if (trade.payTime) return true;
  return trade.paymentType === "CREDIT" || trade.paymentType === "WEBATM" || trade.paymentType === "LINEPAY";
}

export function isNumberNotice(trade: ParsedTrade): boolean {
  return trade.status === "SUCCESS" && !isPaidNotice(trade) && (trade.paymentType === "VACC" || trade.paymentType === "CVS");
}

export function openTrade(fields: { TradeInfo?: string; TradeSha?: string }, hashKey: string, hashIv: string): ParsedTrade | null {
  const info = fields.TradeInfo ?? "";
  const sha = fields.TradeSha ?? "";
  if (!/^[0-9a-f]+$/i.test(info) || !tradeShaMatches(info, sha, hashKey, hashIv)) return null;
  try {
    return parseTrade(decryptTradeInfo(info, hashKey, hashIv));
  } catch {
    return null;
  }
}
