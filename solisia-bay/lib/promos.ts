import type { Gender } from "./types";
import { roundMoney, toCents } from "./money";

export type PromoKind = "percent" | "amount" | "shipping";
export type PromoScope = "all" | "gender" | "product";

export type WallPost = {
  id: string;
  image: string;
  caption: string;
  slug: string;
  published: boolean;
  createdAt: string;
};

export type Promotion = {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  kind: PromoKind;
  value: number;
  minSubtotal: number;
  scope: PromoScope;
  gender: Gender | "";
  slug: string;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  used: number;
  createdAt: string;
};

export type PromoLine = { slug: string; gender?: Gender; unitPrice: number; qty: number };

export type PromoQuote = {
  discount: number;
  freeShipping: boolean;
  promoId: string;
  coupon: string;
};

const EMPTY: PromoQuote = { discount: 0, freeShipping: false, promoId: "", coupon: "" };

export function normalizeCoupon(code: string): string {
  return code.trim().replace(/\s+/g, "").toUpperCase();
}

function eligibleCents(promo: Promotion, items: PromoLine[]): number {
  return items.reduce((sum, item) => {
    const matches =
      promo.scope === "all" ||
      (promo.scope === "gender" && item.gender === promo.gender) ||
      (promo.scope === "product" && item.slug === promo.slug);
    return matches ? sum + toCents(item.unitPrice) * item.qty : sum;
  }, 0);
}

function active(promo: Promotion, now: number): boolean {
  if (!promo.enabled) return false;
  const start = Date.parse(promo.startsAt);
  const end = Date.parse(promo.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false;
  if (now < start || now >= end) return false;
  if (promo.usageLimit > 0 && promo.used >= promo.usageLimit) return false;
  return true;
}

function discountFor(promo: Promotion, items: PromoLine[], subtotalCents: number): number {
  if (subtotalCents < toCents(promo.minSubtotal)) return -1;
  const eligible = eligibleCents(promo, items);
  if (eligible <= 0) return -1;
  if (promo.kind === "shipping") return 0;
  if (promo.kind === "percent") {
    const pct = Math.min(100, Math.max(0, promo.value));
    return Math.min(eligible, Math.round((eligible * pct) / 100));
  }
  return Math.min(eligible, toCents(promo.value));
}

export function quotePromotion(input: {
  items: PromoLine[];
  subtotal: number;
  promotions: Promotion[];
  coupon?: string;
  now?: number;
}): PromoQuote | { error: string } {
  const now = input.now ?? Date.now();
  const coupon = normalizeCoupon(input.coupon ?? "");
  const subtotalCents = toCents(input.subtotal);
  const list = input.promotions ?? [];

  if (coupon) {
    const promo = list.find((item) => item.code && normalizeCoupon(item.code) === coupon);
    if (!promo) return { error: "That code isn't valid." };
    if (!active(promo, now)) return { error: "That code isn't active." };
    const discount = discountFor(promo, input.items, subtotalCents);
    if (discount < 0) {
      return subtotalCents < toCents(promo.minSubtotal)
        ? { error: "Add a little more to use this code." }
        : { error: "That code doesn't apply to these pieces." };
    }
    return {
      discount: roundMoney(discount / 100),
      freeShipping: promo.kind === "shipping",
      promoId: promo.id,
      coupon,
    };
  }

  let best: PromoQuote = EMPTY;
  for (const promo of list) {
    if (promo.code || !active(promo, now)) continue;
    const discount = discountFor(promo, input.items, subtotalCents);
    if (discount < 0) continue;
    const quote: PromoQuote = {
      discount: roundMoney(discount / 100),
      freeShipping: promo.kind === "shipping",
      promoId: promo.id,
      coupon: "",
    };
    const better = quote.discount > best.discount || (quote.discount === best.discount && quote.freeShipping && !best.freeShipping);
    if (better) best = quote;
  }
  return best;
}
