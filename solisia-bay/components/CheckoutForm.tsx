"use client";

import Link from "next/link";
import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import { FreeShippingBar } from "./CartDrawer";
import { getProduct, sizeLabel } from "@/lib/catalog";
import { COUNTRIES } from "@/lib/countries";
import { formatUsd, shippingFor } from "@/lib/money";

type LockedOrder = {
  code: string;
  token: string;
  items: { slug: string; name: string; color: string; size: string; unitPrice: number; qty: number }[];
  subtotal: number;
  shipping: number;
  total: number;
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

export default function CheckoutForm({ paypalClientId }: { paypalClientId: string }) {
  const { lines, subtotal, ready, setQty, remove } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState<LockedOrder | null>(null);

  const viewSubtotal = locked?.subtotal ?? subtotal;
  const shipping = locked?.shipping ?? shippingFor(subtotal);
  const total = locked?.total ?? viewSubtotal + shipping;
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
        const product = getProduct(line.slug);
        return {
          key: line.key,
          slug: line.slug,
          name: product?.name ?? "",
          color: line.color,
          size: product ? sizeLabel(product, line.sizes) : "",
          qty: line.qty,
          lineTotal: (product?.price ?? 0) * line.qty,
          cartKey: line.key,
        };
      });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || locked || lines.length === 0) return;
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
          phone: get("phone"),
          address: {
            country: get("country"),
            line1: get("line1"),
            line2: get("line2"),
            city: get("city"),
            state: get("state"),
            postalCode: get("postalCode"),
          },
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
        shipping?: number;
        total?: number;
      };
      if (!res.ok || !data.code || !data.token) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      if (data.demo) {
        window.location.assign(`/checkout/success?order=${encodeURIComponent(data.code)}&token=${encodeURIComponent(data.token)}`);
        return;
      }
      setLocked({
        code: data.code,
        token: data.token,
        items: data.items ?? [],
        subtotal: data.subtotal ?? 0,
        shipping: data.shipping ?? 0,
        total: data.total ?? 0,
      });
      setBusy(false);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setBusy(false);
    }
  }

  if (ready && lines.length === 0 && !locked) {
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
        <fieldset disabled={Boolean(locked)}>
          <h2 className="serif">Contact</h2>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required maxLength={160} />
          </label>

          <h2 className="serif">Shipping address</h2>
          <label className="field">
            <span>Full name</span>
            <input name="name" autoComplete="name" required minLength={2} maxLength={100} />
          </label>
          <label className="field">
            <span>Country / region</span>
            <select name="country" autoComplete="country-name" required defaultValue="">
              <option value="" disabled>
                Select
              </option>
              {COUNTRIES.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Address</span>
            <input name="line1" autoComplete="address-line1" required minLength={3} maxLength={160} />
          </label>
          <label className="field">
            <span>Apartment, suite, etc. (optional)</span>
            <input name="line2" autoComplete="address-line2" maxLength={160} />
          </label>
          <div className="field-row">
            <label className="field">
              <span>City</span>
              <input name="city" autoComplete="address-level2" required minLength={2} maxLength={80} />
            </label>
            <label className="field">
              <span>State / province</span>
              <input name="state" autoComplete="address-level1" maxLength={80} />
            </label>
            <label className="field">
              <span>Postal code</span>
              <input name="postalCode" autoComplete="postal-code" required minLength={2} maxLength={20} />
            </label>
          </div>
          <label className="field">
            <span>Phone (optional, for the courier)</span>
            <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
          </label>
        </fieldset>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {locked ? (
          <div className="paypal-box">
            <p className="fine">
              Order {locked.code} &middot; {formatUsd(locked.total)}. Pay securely with PayPal.
            </p>
            <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD", intent: "capture" }}>
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect", label: "pay" }}
                createOrder={async () => {
                  const res = await fetch("/api/paypal/order", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ code: locked.code, token: locked.token }),
                  });
                  const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
                  if (!res.ok || !data.id) throw new Error(data.error ?? "Could not start PayPal");
                  return data.id;
                }}
                onApprove={async (data) => {
                  const res = await fetch("/api/paypal/capture", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ code: locked.code, token: locked.token, paypalOrderId: data.orderID }),
                  });
                  const payload = (await res.json().catch(() => ({}))) as { error?: string };
                  if (!res.ok) {
                    setError(payload.error ?? "Payment could not be completed.");
                    return;
                  }
                  window.location.assign(
                    `/checkout/success?order=${encodeURIComponent(locked.code)}&token=${encodeURIComponent(locked.token)}`
                  );
                }}
                onCancel={() => setError("Payment cancelled. You can try PayPal again below.")}
                onError={() => setError("PayPal ran into a problem. Please try again.")}
              />
            </PayPalScriptProvider>
          </div>
        ) : (
          <button type="submit" className="btn btn-solid btn-block" disabled={busy || !ready}>
            {busy ? "Preparing secure payment\u2026" : `Continue to payment \u00B7 ${formatUsd(total)}`}
          </button>
        )}
        <p className="fine">
          Payment is processed securely by PayPal. By continuing you agree to our{" "}
          <Link href="/policies/shipping-returns">shipping &amp; returns policy</Link>.
        </p>
      </form>

      <aside className="checkout-summary" aria-label="Order summary">
        <h2 className="serif">Order summary</h2>
        <FreeShippingBar subtotal={viewSubtotal} />
        <ul className="cart-lines">
          {summary.map((line) => {
            const product = getProduct(line.slug);
            if (!product && !locked) return null;
            return (
              <li key={line.key} className="cart-line">
                <span className="cart-thumb">
                  {product ? <ProductImage product={product} view="front" colorName={line.color} /> : null}
                </span>
                <div className="cart-meta">
                  <span className="cart-name">{line.name}</span>
                  <p className="cart-opts">
                    {line.color} · {line.size}
                  </p>
                  <div className="cart-row">
                    {locked || !line.cartKey ? (
                      <span className="cart-opts">Qty {line.qty}</span>
                    ) : (
                      <div className="qty">
                        <button type="button" onClick={() => line.cartKey && setQty(line.cartKey, line.qty - 1)} aria-label="Decrease quantity">
                          &minus;
                        </button>
                        <span>{line.qty}</span>
                        <button type="button" onClick={() => line.cartKey && setQty(line.cartKey, line.qty + 1)} aria-label="Increase quantity">
                          +
                        </button>
                      </div>
                    )}
                    <span className="price">{formatUsd(line.lineTotal)}</span>
                  </div>
                  {!locked && line.cartKey && (
                    <button type="button" className="link-btn" onClick={() => line.cartKey && remove(line.cartKey)}>
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <dl className="totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatUsd(viewSubtotal)}</dd>
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
