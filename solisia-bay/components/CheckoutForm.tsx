"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import { FreeShippingBar } from "./CartDrawer";
import { getProduct, sizeLabel } from "@/lib/catalog";
import { COUNTRIES } from "@/lib/countries";
import { formatUsd, shippingFor } from "@/lib/money";

export default function CheckoutForm() {
  const { lines, subtotal, ready, setQty, remove } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || lines.length === 0) return;
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: get("email"),
          name: get("name"),
          phone: get("phone"),
          address: {
            country: get("country"),
            line1: get("line1"),
            line2: get("line2"),
            city: get("city"),
            state: get("state"),
            postalCode: get("postalCode"),
          },
          items: lines.map((l) => ({ slug: l.slug, color: l.color, sizes: l.sizes, qty: l.qty })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setBusy(false);
    }
  }

  if (ready && lines.length === 0) {
    return (
      <div className="empty">
        <p className="serif">Your bag is empty.</p>
        <Link href="/collection/all" className="btn btn-solid">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout">
      <form className="checkout-form" onSubmit={onSubmit}>
        <h2 className="serif">Contact</h2>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>

        <h2 className="serif">Shipping address</h2>
        <label className="field">
          <span>Full name</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label className="field">
          <span>Country / region</span>
          <select name="country" autoComplete="country-name" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Address</span>
          <input name="line1" autoComplete="address-line1" required />
        </label>
        <label className="field">
          <span>Apartment, suite, etc. (optional)</span>
          <input name="line2" autoComplete="address-line2" />
        </label>
        <div className="field-row">
          <label className="field">
            <span>City</span>
            <input name="city" autoComplete="address-level2" required />
          </label>
          <label className="field">
            <span>State / province</span>
            <input name="state" autoComplete="address-level1" />
          </label>
          <label className="field">
            <span>Postal code</span>
            <input name="postalCode" autoComplete="postal-code" required />
          </label>
        </div>
        <label className="field">
          <span>Phone (optional, for the courier)</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-solid btn-block" disabled={busy || !ready}>
          {busy ? "Redirecting to secure payment\u2026" : `Continue to payment \u00B7 ${formatUsd(total)}`}
        </button>
        <p className="fine">
          You&rsquo;ll complete payment on a secure page powered by Creem. By continuing you agree to our{" "}
          <Link href="/policies/shipping-returns">shipping &amp; returns policy</Link>.
        </p>
      </form>

      <aside className="checkout-summary" aria-label="Order summary">
        <h2 className="serif">Order summary</h2>
        <FreeShippingBar subtotal={subtotal} />
        <ul className="cart-lines">
          {lines.map((l) => {
            const p = getProduct(l.slug);
            if (!p) return null;
            return (
              <li key={l.key} className="cart-line">
                <span className="cart-thumb">
                  <ProductImage product={p} view="front" colorName={l.color} />
                </span>
                <div className="cart-meta">
                  <span className="cart-name">{p.name}</span>
                  <p className="cart-opts">
                    {l.color} · {sizeLabel(p, l.sizes)}
                  </p>
                  <div className="cart-row">
                    <div className="qty">
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
        <dl className="totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatUsd(subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatUsd(shipping)}</dd>
          </div>
          <div className="totals-grand">
            <dt>Total (USD)</dt>
            <dd>{formatUsd(total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
