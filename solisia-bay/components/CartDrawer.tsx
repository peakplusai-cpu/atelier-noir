"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import { sizeLabel } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { formatUsd, shippingFor } from "@/lib/money";
import { SITE } from "@/lib/site";

export function FreeShippingBar({ subtotal, threshold = SITE.freeShippingThreshold }: { subtotal: number; threshold?: number }) {
  const remaining = Math.max(0, Math.round((threshold - subtotal) * 100) / 100);
  const pct = threshold > 0 ? Math.min(100, Math.max(0, (subtotal / threshold) * 100)) : 100;
  const unlocked = remaining === 0 && subtotal > 0;
  return (
    <div className="ship-bar" data-unlocked={unlocked}>
      <p>
        {subtotal <= 0 ? (
          <>
            Free worldwide shipping on orders over <strong>{formatUsd(threshold)}</strong>
          </>
        ) : unlocked ? (
          <>You&rsquo;ve unlocked <strong>free worldwide shipping</strong></>
        ) : (
          <>
            You&rsquo;re <strong>{formatUsd(remaining)}</strong> away from free worldwide shipping
          </>
        )}
      </p>
      <div className="ship-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { isOpen, closeCart, lines, subtotal, setQty, remove, count } = useCart();
  const { products, settings } = useCatalog();
  const closeRef = useRef<HTMLButtonElement>(null);

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

  const shipping = shippingFor(subtotal, { threshold: settings.freeShippingThreshold, flat: settings.flatShipping });
  const remaining = Math.max(0, Math.round((settings.freeShippingThreshold - subtotal) * 100) / 100);
  const inCart = new Set(lines.map((l) => l.slug));
  const suggestions =
    remaining > 0 && lines.length > 0
      ? products
          .filter((p) => !inCart.has(p.slug) && p.price >= Math.min(remaining, 50))
          .sort((a, b) => Math.abs(a.price - remaining) - Math.abs(b.price - remaining))
          .slice(0, 2)
      : [];

  return (
    <div className="drawer-root" data-open={isOpen} aria-hidden={!isOpen}>
      <div className="drawer-scrim" onClick={closeCart} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div className="drawer-head">
          <h2>Your Bag {count > 0 && <span>({count})</span>}</h2>
          <button ref={closeRef} type="button" className="icon-btn" aria-label="Close cart" onClick={closeCart}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M5 5l12 12M17 5L5 17" />
            </svg>
          </button>
        </div>

        <FreeShippingBar subtotal={subtotal} threshold={settings.freeShippingThreshold} />

        <div className="drawer-body">
          {lines.length === 0 ? (
            <div className="drawer-empty">
              <p className="serif">Your bag is empty.</p>
              <p>Start with the pieces everyone is packing this season.</p>
              <Link href="/collection/all" className="btn btn-outline" onClick={closeCart}>
                Shop the collection
              </Link>
            </div>
          ) : (
            <ul className="cart-lines">
              {lines.map((l) => {
                const p = products.find((item) => item.slug === l.slug);
                if (!p) return null;
                return (
                  <li key={l.key} className="cart-line">
                    <Link href={`/products/${p.slug}`} className="cart-thumb" onClick={closeCart}>
                      <ProductImage product={p} view="front" colorName={l.color} />
                    </Link>
                    <div className="cart-meta">
                      <Link href={`/products/${p.slug}`} onClick={closeCart} className="cart-name">
                        {p.name}
                      </Link>
                      <p className="cart-opts">
                        {l.color} · {sizeLabel(p, l.sizes)}
                      </p>
                      <div className="cart-row">
                        <div className="qty" role="group" aria-label={`Quantity for ${p.name}`}>
                          <button type="button" onClick={() => setQty(l.key, l.qty - 1)} aria-label="Decrease quantity">
                            &minus;
                          </button>
                          <span>{l.qty}</span>
                          <button type="button" onClick={() => setQty(l.key, l.qty + 1)} aria-label="Increase quantity">
                            +
                          </button>
                        </div>
                        <span className="price">{formatUsd(p.price * l.qty)}</span>
                      </div>
                      <button type="button" className="link-btn" onClick={() => remove(l.key)}>
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {suggestions.length > 0 && (
            <div className="upsell">
              <h3>Add a little more</h3>
              {suggestions.map((p) => (
                <Link key={p.slug} href={`/products/${p.slug}`} className="upsell-item" onClick={closeCart}>
                  <span className="cart-thumb">
                    <ProductImage product={p} view="front" />
                  </span>
                  <span>
                    <span className="cart-name">{p.name}</span>
                    <span className="cart-opts">{formatUsd(p.price)}</span>
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
                <dt>Subtotal</dt>
                <dd>{formatUsd(subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatUsd(shipping)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn btn-solid btn-block" onClick={closeCart}>
              Checkout &middot; {formatUsd(subtotal + shipping)}
            </Link>
            <p className="fine">Secure checkout, powered by PayPal.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
