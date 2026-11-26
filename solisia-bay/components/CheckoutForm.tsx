"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import { FreeShippingBar } from "./CartDrawer";
import { sizeLabel } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { previewTotals } from "@/lib/fx";
import { TAIWAN_CITIES } from "@/lib/taiwan";
import { colorLabel, localizedName, t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { useMarket } from "./MarketProvider";

type LockedOrder = {
  code: string;
  token: string;
  items: { slug: string; name: string; color: string; size: string; unitPrice: number; qty: number }[];
  subtotal: number;
  discount?: number;
  shipping: number;
  total: number;
  currency: string;
  displayCurrency: string;
  displayTotal: number;
};

type SummaryLine = {
  key: string;
  slug: string;
  name: string;
  color: string;
  size: string;
  qty: number;
  lineTotal: number;
  cartKey?: string;
};

export default function CheckoutForm({ paymentsReady }: { paymentsReady: boolean }) {
  const { lines, ready, setQty, remove } = useCart();
  const { products, settings } = useCatalog();
  const market = useMarket();
  const lang = market.lang;
  const money = (amount: number, currency = market.currency) => formatMoney(amount, currency, lang);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<{ total: number; discount: number; coupon: string; currency: string; chargeTotal: number } | null>(null);
  const [locked, setLocked] = useState<LockedOrder | null>(null);

  useEffect(() => {
    const code = coupon.trim();
    if (!code || lines.length === 0) {
      setQuote(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          coupon: code,
          items: lines.map((line) => ({ slug: line.slug, color: line.color, sizes: line.sizes, qty: line.qty })),
        }),
      })
        .then((res) => res.json())
        .then((data: { total?: number; discount?: number; coupon?: string; error?: string; currency?: string; chargeTotal?: number }) => {
          if (data.coupon && typeof data.total === "number") {
            setQuote({ total: data.total, discount: data.discount ?? 0, coupon: data.coupon, currency: data.currency ?? market.currency, chargeTotal: data.chargeTotal ?? data.total });
          } else setQuote(null);
        })
        .catch(() => setQuote(null));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [coupon, lines]);

  const preview = previewTotals(
    lines.map((line) => ({ unitPrice: products.find((item) => item.slug === line.slug)?.price ?? 0, qty: line.qty })),
    { threshold: settings.freeShippingThreshold, flat: settings.flatShipping },
    market.currency,
    market.rates
  );
  const payableCode = "TWD";
  const payablePreview = payableCode === market.currency ? preview : previewTotals(
    lines.map((line) => ({ unitPrice: products.find((item) => item.slug === line.slug)?.price ?? 0, qty: line.qty })),
    { threshold: settings.freeShippingThreshold, flat: settings.flatShipping },
    payableCode,
    market.rates
  );
  const viewSubtotal = locked?.subtotal ?? preview.subtotal;
  const shipping = locked?.shipping ?? preview.shipping;
  const total = locked?.total ?? preview.total;
  const summary: SummaryLine[] = locked
    ? locked.items.map((item) => ({
        key: `${item.slug}|${item.color}|${item.size}`,
        slug: item.slug,
        name: item.name,
        color: item.color,
        size: item.size,
        qty: item.qty,
        lineTotal: item.unitPrice * item.qty,
      }))
    : lines.map((line) => {
        const product = products.find((item) => item.slug === line.slug);
        return {
          key: line.key,
          slug: line.slug,
          name: product ? localizedName(product, lang) : "",
          color: line.color,
          size: product ? sizeLabel(product, line.sizes) : "",
          qty: line.qty,
          lineTotal: product
            ? previewTotals([{ unitPrice: product.price, qty: line.qty }], { threshold: settings.freeShippingThreshold, flat: settings.flatShipping }, market.currency, market.rates).subtotal
            : 0,
          cartKey: line.key,
        };
      });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || locked || lines.length === 0 || !paymentsReady) return;
    const form = new FormData(e.currentTarget);
    const get = (key: string) => String(form.get(key) ?? "");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: get("email"),
          name: get("name"),
          phone: get("phone").replace(/\s/g, ""),
          address: {
            country: get("country"),
            line1: get("line1"),
            line2: get("line2"),
            city: get("city"),
            state: get("state"),
            postalCode: get("postalCode"),
          },
          coupon,
          items: lines.map((line) => ({ slug: line.slug, color: line.color, sizes: line.sizes, qty: line.qty })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
        token?: string;
        demo?: boolean;
        error?: string;
        items?: LockedOrder["items"];
        subtotal?: number;
        discount?: number;
        shipping?: number;
        total?: number;
        currency?: string;
        displayCurrency?: string;
        displayTotal?: number;
      };
      if (!res.ok || !data.code || !data.token) {
        setError(data.error ?? t(lang, "generic"));
        setBusy(false);
        return;
      }
      const gateway = data as { action?: string; fields?: Record<string, string> };
      if (gateway.action && gateway.fields) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = gateway.action;
        for (const [name, value] of Object.entries(gateway.fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }
      setLocked({
        code: data.code,
        token: data.token,
        items: data.items ?? [],
        subtotal: data.subtotal ?? 0,
        discount: data.discount ?? 0,
        shipping: data.shipping ?? 0,
        total: data.total ?? 0,
        currency: data.currency ?? payableCode,
        displayCurrency: data.displayCurrency ?? market.currency,
        displayTotal: data.displayTotal ?? data.total ?? 0,
      });
      setBusy(false);
    } catch {
      setError(t(lang, "network"));
      setBusy(false);
    }
  }

  if (ready && lines.length === 0 && !locked) {
    return (
      <div className="empty">
        <p className="serif">{t(lang, "emptyBag")}</p>
        <Link href="/collection/all" className="btn btn-solid">
          {t(lang, "shopCollection")}
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout">
      <form className="checkout-form" onSubmit={onSubmit}>
        <fieldset disabled={Boolean(locked)}>
          <h2 className="serif">{t(lang, "contact")}</h2>
          <label className="field">
            <span>{t(lang, "email")}</span>
            <input name="email" type="email" autoComplete="email" required maxLength={160} />
          </label>

          <h2 className="serif">{t(lang, "shipAddress")}</h2>
          <label className="field">
            <span>{t(lang, "fullName")}</span>
            <input name="name" autoComplete="name" autoCapitalize="words" required minLength={2} maxLength={100} />
          </label>
          <div className="field-row">
            <label className="field">
              <span>縣市</span>
              <select name="city" autoComplete="address-level1" required defaultValue="">
                <option value="" disabled>請選擇</option>
                {TAIWAN_CITIES.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>區</span>
              <input name="state" autoComplete="address-level2" required minLength={2} maxLength={20} />
            </label>
            <label className="field">
              <span>郵遞區號</span>
              <input name="postalCode" autoComplete="postal-code" inputMode="numeric" required minLength={3} maxLength={6} pattern="[0-9]{3,6}" />
            </label>
          </div>
          <label className="field">
            <span>地址</span>
            <input name="line1" autoComplete="street-address" autoCapitalize="words" required minLength={3} maxLength={160} />
          </label>
          <input type="hidden" name="line2" value="" />
          <label className="field">
            <span>手機</span>
            <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required minLength={10} maxLength={10} pattern="09[0-9]{8}" placeholder="09xxxxxxxx" />
          </label>
          <label className="field">
            <span>{t(lang, "coupon")}</span>
            <input value={coupon} onChange={(event) => setCoupon(event.target.value)} maxLength={24} autoComplete="off" />
          </label>
        </fieldset>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="checkout-pay">
          {!paymentsReady ? (
            <p className="form-error" role="status">付款功能尚未開通</p>
          ) : null}
          <button type="submit" className="btn btn-solid btn-block" disabled={busy || !ready || !paymentsReady || Boolean(locked)}>
            {busy ? t(lang, "preparing") : paymentLabel(lang, coupon, total, quote, (amount) => money(amount))}
          </button>
        </div>
        <p className="fine">
          付款由藍新金流處理。繼續即表示你同意{" "}
          <Link href="/policies/shipping-returns">運送與退貨</Link>。
        </p>
      </form>

      <aside className="checkout-summary" aria-label={t(lang, "summary")}>
        <h2 className="serif">{t(lang, "summary")}</h2>
        <FreeShippingBar subtotal={locked ? locked.subtotal : preview.subtotal} threshold={locked ? payablePreview.threshold : preview.threshold} />
        <ul className="cart-lines">
          {summary.map((line) => {
            const product = products.find((item) => item.slug === line.slug);
            if (!product && !locked) return null;
            return (
              <li key={line.key} className="cart-line">
                <span className="cart-thumb">
                  {product ? <ProductImage product={product} view="front" colorName={line.color} /> : null}
                </span>
                <div className="cart-meta">
                  <span className="cart-name">{line.name}</span>
                  <p className="cart-opts">
                    {colorLabel(line.color, lang)} · {line.size}
                  </p>
                  <div className="cart-row">
                    {locked || !line.cartKey ? (
                      <span className="cart-opts">{t(lang, "qty")} {line.qty}</span>
                    ) : (
                      <div className="qty">
                        <button type="button" onClick={() => line.cartKey && setQty(line.cartKey, line.qty - 1)} aria-label={t(lang, "decrease")}>
                          &minus;
                        </button>
                        <span>{line.qty}</span>
                        <button type="button" onClick={() => line.cartKey && setQty(line.cartKey, line.qty + 1)} aria-label={t(lang, "increase")}>
                          +
                        </button>
                      </div>
                    )}
                    <span className="price">{money(line.lineTotal, locked?.currency)}</span>
                  </div>
                  {!locked && line.cartKey && (
                    <button type="button" className="link-btn" onClick={() => line.cartKey && remove(line.cartKey)}>
                      {t(lang, "remove")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <dl className="totals">
          <div>
            <dt>{t(lang, "subtotal")}</dt>
            <dd>{money(viewSubtotal, locked?.currency)}</dd>
          </div>
          {(locked?.discount ?? matchedQuote(coupon, quote)?.discount ?? 0) > 0 && (
            <div>
              <dt>{t(lang, "discount")}</dt>
              <dd>-{money(locked?.discount ?? matchedQuote(coupon, quote)?.discount ?? 0, locked?.currency)}</dd>
            </div>
          )}
          <div>
            <dt>{t(lang, "shipping")}</dt>
            <dd>{shipping === 0 ? t(lang, "free") : money(shipping, locked?.currency)}</dd>
          </div>
          <div className="totals-grand">
            <dt>{t(lang, "total")}</dt>
            <dd>{money(locked ? total : matchedQuote(coupon, quote)?.total ?? total, locked?.currency)}</dd>
          </div>
        </dl>
        {(locked ? locked.currency !== locked.displayCurrency : payableCode !== market.currency) && (
          <p className="fine">{t(lang, "paypalCharges", { amount: money(locked ? locked.total : quote?.chargeTotal ?? payablePreview.total, locked?.currency ?? payableCode) })}</p>
        )}
      </aside>
    </div>
  );
}

function normalizeCode(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function matchedQuote<T extends { total: number; discount: number; coupon: string }>(coupon: string, quote: T | null) {
  if (!quote || !coupon.trim()) return null;
  return normalizeCode(quote.coupon) === normalizeCode(coupon) ? quote : null;
}

function paymentLabel(lang: "zh" | "en", coupon: string, fallback: number, quote: { total: number; discount: number; coupon: string } | null, money: (amount: number) => string): string {
  const match = matchedQuote(coupon, quote);
  if (match) return `${t(lang, "continuePay")} \u00B7 ${money(match.total)}`;
  if (coupon.trim()) return t(lang, "continuePay");
  return `${t(lang, "continuePay")} \u00B7 ${money(fallback)}`;
}
