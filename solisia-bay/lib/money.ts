import { SITE } from "./site";

export function formatUsd(amount: number): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: SITE.currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= SITE.freeShippingThreshold ? 0 : SITE.flatShipping;
}

export function amountToFreeShipping(subtotal: number): number {
  return Math.max(0, Math.round((SITE.freeShippingThreshold - subtotal) * 100) / 100);
}
