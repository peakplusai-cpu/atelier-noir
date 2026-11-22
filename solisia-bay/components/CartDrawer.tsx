"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import { sizeLabel } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { previewTotals } from "@/lib/fx";
import { colorLabel, localizedName, t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { useMarket } from "./MarketProvider";

export function FreeShippingBar({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const { lang, currency } = useMarket();
  const money = (amount: number) => formatMoney(amount, currency, lang);
  const remaining = Math.max(0, Math.round((threshold - subtotal) * 100) / 100);
  const pct = threshold > 0 ? Math.min(100, Math.max(0, (subtotal / threshold) * 100)) : 100;
  const unlocked = remaining === 0 && subtotal > 0;
  return (
    <div className="ship-bar" data-unlocked={unlocked}>
      <p>
        {subtotal <= 0 ? (
          t(lang, "shipEmpty", { amount: money(threshold) })
        ) : unlocked ? (
          t(lang, "shipUnlocked")
        ) : (
          t(lang, "shipAway", { amount: money(remaining) })
        )}
      </p>
      <div className="ship-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { isOpen, closeCart, lines, setQty, remove, count } = useCart();
  const { products, settings } = useCatalog();
  const market = useMarket();
  const lang = market.lang;
  const closeRef = useRef<HTMLButtonElement>(null);
  const money = (amount: number) => formatMoney(amount, market.currency, lang);

  useEffect(() => {
    if (!isOpen) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [isOpen, closeCart]);

  const priced = previewTotals(
    lines.map((line) => ({ unitPrice: products.find((item) => item.slug === line.slug)?.price ?? 0, qty: line.qty })),
    { threshold: settings.freeShippingThreshold, flat: settings.flatShipping },
    market.currency,
    market.rates
  );
  const remainingTwd = Math.max(0, settings.freeShippingThreshold - lines.reduce((sum, line) => sum + (products.find((item) => item.slug === line.slug)?.price ?? 0) * line.qty, 0));
  const inCart = new Set(lines.map((l) => l.slug));
  const suggestions =
    remainingTwd > 0 && lines.length > 0
      ? products
          .filter((p) => !inCart.has(p.slug) && p.price >= Math.min(remainingTwd, 50))
          .sort((a, b) => Math.abs(a.price - remainingTwd) - Math.abs(b.price - remainingTwd))
          .slice(0, 2)
      : [];

  return (
    <div className="drawer-root" data-open={isOpen} aria-hidden={!isOpen}>
      <div className="drawer-scrim" onClick={closeCart} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={t(lang, "cart")}>
        <div className="drawer-head">
          <h2>
            {t(lang, "bag")} {count > 0 && <span>({count})</span>}
          </h2>
          <button ref={closeRef} type="button" className="icon-btn" aria-label={t(lang, "closeCart")} onClick={closeCart}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M5 5l12 12M17 5L5 17" />
            </svg>
          </button>
        </div>

        <FreeShippingBar subtotal={priced.subtotal} threshold={priced.threshold} />

        <div className="drawer-body">
          {lines.length === 0 ? (
            <div className="drawer-empty">
              <p className="serif">{t(lang, "emptyBag")}</p>
              <Link href="/collection/all" className="btn btn-outline" onClick={closeCart}>
                {t(lang, "shopCollection")}
              </Link>
            </div>
          ) : (
            <ul className="cart-lines">
              {lines.map((l) => {
                const p = products.find((item) => item.slug === l.slug);
                if (!p) return null;
                const name = localizedName(p, lang);
                const lineTotal = previewTotals([{ unitPrice: p.price, qty: l.qty }], { threshold: settings.freeShippingThreshold, flat: settings.flatShipping }, market.currency, market.rates).subtotal;
                return (
                  <li key={l.key} className="cart-line">
                    <Link href={`/products/${p.slug}`} className="cart-thumb" onClick={closeCart}>
                      <ProductImage product={p} view="front" colorName={l.color} />
                    </Link>
                    <div className="cart-meta">
                      <Link href={`/products/${p.slug}`} onClick={closeCart} className="cart-name">
                        {name}
                      </Link>
                      <p className="cart-opts">
                        {colorLabel(l.color, lang)} · {sizeLabel(p, l.sizes)}
                      </p>
                      <div className="cart-row">
                        <div className="qty" role="group" aria-label={t(lang, "qtyFor", { name })}>
                          <button type="button" onClick={() => setQty(l.key, l.qty - 1)} aria-label={t(lang, "decrease")}>
                            &minus;
                          </button>
                          <span>{l.qty}</span>
                          <button type="button" onClick={() => setQty(l.key, l.qty + 1)} aria-label={t(lang, "increase")}>
                            +
                          </button>
                        </div>
                        <span className="price">{money(lineTotal)}</span>
                      </div>
                      <button type="button" className="link-btn" onClick={() => remove(l.key)}>
                        {t(lang, "remove")}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {suggestions.length > 0 && (
            <div className="upsell">
              <h3>{t(lang, "addMore")}</h3>
              {suggestions.map((p) => (
                <Link key={p.slug} href={`/products/${p.slug}`} className="upsell-item" onClick={closeCart}>
                  <span className="cart-thumb">
                    <ProductImage product={p} view="front" />
                  </span>
                  <span>
                    <span className="cart-name">{localizedName(p, lang)}</span>
                    <span className="cart-opts">{money(previewTotals([{ unitPrice: p.price, qty: 1 }], { threshold: settings.freeShippingThreshold, flat: 0 }, market.currency, market.rates).subtotal)}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="drawer-foot">
            <dl className="totals">
              <div>
                <dt>{t(lang, "subtotal")}</dt>
                <dd>{money(priced.subtotal)}</dd>
              </div>
              <div>
                <dt>{t(lang, "shipping")}</dt>
                <dd>{priced.shipping === 0 ? t(lang, "free") : money(priced.shipping)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn btn-solid btn-block" onClick={closeCart}>
              {t(lang, "checkout")} &middot; {money(priced.total)}
            </Link>
            <p className="fine">{t(lang, "securePaypal")}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
