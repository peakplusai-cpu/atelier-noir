import { currencyDecimals, roundCurrency } from "./currency";
import { SITE } from "./site";

export function formatMoney(amount: number, currency = "TWD", lang: "zh" | "en" = "en"): string {
  const digits = currencyDecimals(currency);
  const safe = roundCurrency(Number.isFinite(amount) ? amount : 0, currency);
  return new Intl.NumberFormat(lang === "zh" ? "zh-Hant" : "en", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(safe);
}

/** Admin totals are the stored TWD amounts. */
export function formatUsd(amount: number): string {
  return formatMoney(amount, "TWD", "zh");
}

export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

/** Formats integer cents without binary floating-point rounding. */
export function centsToMoney(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error("cents must be an integer");
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function parseMoneyToCents(value: string): number | null {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value)) return null;
  const [whole, frac = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function shippingFor(subtotal: number, rules?: { threshold?: number; flat?: number }): number {
  const threshold = rules?.threshold ?? SITE.freeShippingThreshold;
  const flat = rules?.flat ?? SITE.flatShipping;
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  if (!(flat > 0) || !(threshold > 0)) return 0;
  return subtotal >= threshold ? 0 : flat;
}

export function amountToFreeShipping(subtotal: number): number {
  if (!Number.isFinite(subtotal)) return SITE.freeShippingThreshold;
  return Math.max(0, roundMoney(SITE.freeShippingThreshold - subtotal));
}

export function savings(price: number, compareAt?: number): number {
  if (!compareAt || !Number.isFinite(compareAt) || !Number.isFinite(price) || compareAt <= price) return 0;
  return roundMoney(compareAt - price);
}
