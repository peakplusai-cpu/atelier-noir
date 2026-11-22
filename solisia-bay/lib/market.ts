import { SWITCH_CURRENCIES } from "./currency";

export const PREF_COOKIE = "clack_pref";

export type Lang = "zh" | "en";

export type Market = {
  country: string;
  lang: Lang;
  currency: string;
};

const EUR = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
];

const COUNTRY_CURRENCY: Record<string, string> = {
  TW: "TWD",
  CN: "CNY",
  US: "USD",
  JP: "JPY",
  HK: "HKD",
  KR: "KRW",
  AU: "AUD",
  CA: "CAD",
  SG: "SGD",
  GB: "GBP",
};

for (const code of EUR) COUNTRY_CURRENCY[code] = "EUR";

const CURRENCY_SET = new Set<string>(SWITCH_CURRENCIES);

export function languageFor(country: string): Lang {
  return country === "TW" || country === "CN" ? "zh" : "en";
}

export function currencyFor(country: string): string {
  return COUNTRY_CURRENCY[country] ?? "USD";
}

export function parsePref(value: string | null | undefined): { lang: Lang; currency: string } | null {
  if (!value) return null;
  const match = /^([a-z]{2})\.([A-Z]{3})$/.exec(value.trim());
  if (!match) return null;
  const lang = match[1] === "zh" || match[1] === "en" ? match[1] : null;
  const currency = CURRENCY_SET.has(match[2]) ? match[2] : null;
  if (!lang || !currency) return null;
  return { lang, currency };
}

/** Cookie wins over the IP country. Missing geo defaults to Taiwan. */
export function resolveMarket(countryHeader: string | null | undefined, pref: string | null | undefined): Market {
  const raw = (countryHeader ?? "").trim().toUpperCase();
  const country = /^[A-Z]{2}$/.test(raw) ? raw : "TW";
  const chosen = parsePref(pref);
  return {
    country,
    lang: chosen?.lang ?? languageFor(country),
    currency: chosen?.currency ?? currencyFor(country),
  };
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function marketFromRequest(request: Request): Market {
  return resolveMarket(request.headers.get("x-vercel-ip-country"), readCookie(request.headers.get("cookie"), PREF_COOKIE));
}
