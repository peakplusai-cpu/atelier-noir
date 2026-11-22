/** Money is stored in TWD. These are units of each currency for 1 TWD. */
export const FALLBACK_RATES: Record<string, number> = {
  TWD: 1,
  USD: 0.030321,
  CNY: 0.2025,
  JPY: 4.821796,
  HKD: 0.237981,
  KRW: 40.785075,
  EUR: 0.027615,
  GBP: 0.023125,
  AUD: 0.045744,
  CAD: 0.043427,
  SGD: 0.039113,
};

export const SWITCH_CURRENCIES = ["TWD", "CNY", "USD", "JPY", "HKD", "KRW", "EUR", "GBP", "AUD", "CAD", "SGD"] as const;

/** PayPal accepts these for a normal merchant checkout. CNY and KRW are not. */
export const PAYPAL_CURRENCIES = new Set(["USD", "EUR", "GBP", "AUD", "CAD", "SGD", "JPY", "HKD", "TWD"]);

/**
 * PayPal zero-decimal currencies. HKD uses 2 decimals in PayPal even though
 * cash prices are often whole dollars.
 */
const ZERO_DECIMAL = new Set(["TWD", "JPY", "KRW", "HUF"]);

export type Rates = Record<string, number>;

export function currencyDecimals(currency: string): 0 | 2 {
  return ZERO_DECIMAL.has(currency) ? 0 : 2;
}

export function roundCurrency(amount: number, currency: string): number {
  if (!Number.isFinite(amount)) return 0;
  const factor = currencyDecimals(currency) === 0 ? 1 : 100;
  return Math.round(amount * factor) / factor;
}

export function rateFor(rates: Rates, currency: string): number {
  const value = rates[currency];
  if (typeof value === "number" && value > 0 && Number.isFinite(value)) return value;
  return FALLBACK_RATES[currency] ?? FALLBACK_RATES.USD;
}

export function chargeCurrency(display: string): string {
  return PAYPAL_CURRENCIES.has(display) ? display : "USD";
}

/** PayPal `value` string from the 2-decimal cents used inside an order. */
export function paypalAmount(cents: number, currency: string): string {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("bad amount");
  if (cents === 0) return currencyDecimals(currency) === 0 ? "0" : "0.00";
  if (currencyDecimals(currency) === 0) {
    if (cents % 100 !== 0) throw new Error("zero-decimal currency must be a whole unit");
    return String(cents / 100);
  }
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Turns a PayPal capture value back into the cents chargeCents expects. */
export function paypalCaptureToCents(value: string, currency: string): number | null {
  if (currencyDecimals(currency) === 0) {
    if (!/^\d{1,8}$/.test(value)) return null;
    const major = Number(value);
    return major > 0 ? major * 100 : null;
  }
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value)) return null;
  const [whole, frac = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
