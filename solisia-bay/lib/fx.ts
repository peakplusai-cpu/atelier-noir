import { FALLBACK_RATES, SWITCH_CURRENCIES, chargeCurrency, rateFor, roundCurrency, type Rates } from "./currency";
import { roundMoney, shippingFor, toCents } from "./money";
import { chargeCents, type PricedCart } from "./pricing";

const FX_URL = "https://open.er-api.com/v6/latest/TWD";

export function convertAmount(twd: number, currency: string, rates: Rates): number {
  return roundCurrency(twd * rateFor(rates, currency), currency);
}

/** Converts a TWD cart into another currency and keeps the parts sum to the total. */
export function convertCart(cart: PricedCart, currency: string, rates: Rates): PricedCart {
  const items = cart.items.map((item) => {
    const base = item.unitPriceTwd ?? item.unitPrice;
    return { ...item, unitPriceTwd: base, unitPrice: convertAmount(base, currency, rates) };
  });
  const subtotalCents = items.reduce((sum, item) => sum + toCents(item.unitPrice) * item.qty, 0);
  const subtotal = subtotalCents / 100;
  const shipThreshold = convertAmount(cart.shipThreshold, currency, rates);
  const shipFlat = convertAmount(cart.shipFlat, currency, rates);
  const shipping = cart.shippingWaived ? 0 : shippingFor(subtotal, { threshold: shipThreshold, flat: shipFlat });
  const discountCents = Math.min(subtotalCents, toCents(convertAmount(cart.discount, currency, rates)));
  const totalCents = subtotalCents - discountCents + toCents(shipping);
  return {
    ...cart,
    items,
    subtotal,
    shipping,
    discount: discountCents / 100,
    total: totalCents / 100,
    shipThreshold,
    shipFlat,
  };
}

export type SettledCart = {
  base: PricedCart;
  charge: PricedCart;
  display: PricedCart;
  chargeCode: string;
  displayCode: string;
  fxRate: number;
};

export function settleCart(base: PricedCart, displayCode: string, rates: Rates): SettledCart {
  const chargeCode = chargeCurrency(displayCode);
  const charge = convertCart(base, chargeCode, rates);
  const display = displayCode === chargeCode ? charge : convertCart(base, displayCode, rates);
  if (chargeCents(charge) === null) throw new Error("Converted order is inconsistent");
  return { base, charge, display, chargeCode, displayCode, fxRate: rateFor(rates, chargeCode) };
}

export function previewTotals(
  lines: { unitPrice: number; qty: number }[],
  rules: { threshold: number; flat: number },
  currency: string,
  rates: Rates
): { subtotal: number; shipping: number; total: number; threshold: number } {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0));
  const shipping = shippingFor(subtotal, rules);
  const cart: PricedCart = {
    items: lines.map((line, index) => ({
      slug: `line-${index}`,
      name: "",
      color: "",
      size: "",
      unitPrice: line.unitPrice,
      qty: line.qty,
    })),
    subtotal,
    shipping,
    discount: 0,
    total: roundMoney(subtotal + shipping),
    coupon: "",
    promoId: "",
    shippingWaived: false,
    shipThreshold: rules.threshold,
    shipFlat: rules.flat,
  };
  const converted = convertCart(cart, currency, rates);
  return {
    subtotal: converted.subtotal,
    shipping: converted.shipping,
    total: converted.total,
    threshold: converted.shipThreshold,
  };
}

export async function getRates(): Promise<Rates> {
  try {
    const res = await fetch(FX_URL, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { ...FALLBACK_RATES };
    const body = (await res.json()) as { result?: string; rates?: Record<string, unknown> };
    if (body.result !== "success" || !body.rates) return { ...FALLBACK_RATES };
    const rates = { ...FALLBACK_RATES };
    for (const code of SWITCH_CURRENCIES) {
      const value = body.rates[code];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) rates[code] = value;
    }
    rates.TWD = 1;
    return rates;
  } catch {
    return { ...FALLBACK_RATES };
  }
}
