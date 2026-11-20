"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { clearCart } from "@/lib/cart-client";
import { CVS_BRANDS } from "@/lib/cvs";
import type { Fulfillment, PaymentMethod, PickupPoint } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { SummaryRows, totals, useCart } from "./CartView";

export function CheckoutForm({
  identity,
  paymentNote,
  pickupPoints,
  cvsEnabled,
  cvsCodEnabled,
  onlinePay,
  cancelDays,
}: {
  identity: { name: string } | null;
  paymentNote: string;
  pickupPoints: PickupPoint[];
  cvsEnabled: boolean;
  cvsCodEnabled: boolean;
  onlinePay: boolean;
  cancelDays: number;
}) {
  const router = useRouter();
  const { data } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<Fulfillment>("delivery");
  const [pickupId, setPickupId] = useState(pickupPoints[0]?.id ?? "");
  const [cvsBrand, setCvsBrand] = useState(CVS_BRANDS[0]);
  const [payment, setPayment] = useState<PaymentMethod>(onlinePay ? "online" : "offline");
  const pickupOn = pickupPoints.length > 0 && method === "pickup";
  const cvsOn = cvsEnabled && method === "cvs";
  const codOn = cvsOn && cvsCodEnabled;
  const effectivePayment: PaymentMethod = payment === "cod" && !codOn ? (onlinePay ? "online" : "offline") : payment;
  const methods: { key: Fulfillment; label: string }[] = [{ key: "delivery", label: "宅配" }];
  if (cvsEnabled) methods.push({ key: "cvs", label: "超商取貨" });
  if (pickupPoints.length > 0) methods.push({ key: "pickup", label: "自取" });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data || busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: data.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
        recipient: form.get("recipient"),
        phone: form.get("phone"),
        address: form.get("address"),
        note: form.get("note"),
        lineId: form.get("lineId"),
        lineName: form.get("lineName"),
        fulfillment: pickupOn ? "pickup" : cvsOn ? "cvs" : "delivery",
        pickupPointId: pickupOn ? pickupId : "",
        cvsBrand: cvsOn ? cvsBrand : "",
        cvsStoreName: cvsOn ? form.get("cvsStoreName") : "",
        cvsStoreCode: cvsOn ? form.get("cvsStoreCode") : "",
        paymentMethod: effectivePayment,
      }),
    });
    const json = (await res.json()) as { code?: string; token?: string; payUrl?: string; error?: string };
    if (!res.ok || !json.code) {
      setError(json.error ?? "送出失敗，請稍後再試");
      setBusy(false);
      return;
    }
    clearCart();
    if (json.payUrl) {
      window.location.href = json.payUrl;
      return;
    }
    router.push(`/order/${json.code}?t=${json.token}`);
  }

  if (!data) return <div className="empty">載入中…</div>;
  if (!data.lines.length) {
    return (
      <div className="empty">
        <span className="eyebrow">Your bag is empty</span>
        <p>購物袋目前沒有商品。</p>
        <Link href="/" className="btn">
          回到商品
        </Link>
      </div>
    );
  }
  const blocked = data.lines.some((l) => l.stock < 1 || l.qty > l.stock);
  const selected = pickupPoints.find((p) => p.id === pickupId);

  return (
    <form onSubmit={submit} className="cart-grid">
      <div>
        {identity ? (
          <div className="identity">
            <div className="who">
              <small>LINE 已連接</small>
              {identity.name || "LINE 使用者"}
            </div>
            <a href="/api/line/logout?next=/checkout" className="link" style={{ fontSize: 13 }}>
              切換帳號
            </a>
          </div>
        ) : (
          <div className="panel" style={{ paddingBottom: 26 }}>
            <h2>
              LINE 資料
              <small>用來辨識您的身分，同一位客人的多次訂單會自動合併處理。</small>
            </h2>
            <div className="two">
              <label className="field">
                <span className="label">LINE 名稱</span>
                <input className="input" name="lineName" required maxLength={60} />
              </label>
              <label className="field">
                <span className="label">LINE ID</span>
                <input className="input" name="lineId" required maxLength={60} />
              </label>
            </div>
          </div>
        )}

        {methods.length > 1 && (
          <div className="method-switch" role="radiogroup" aria-label="取貨方式">
            {methods.map((m) => (
              <button
                key={m.key}
                type="button"
                className={method === m.key ? "on" : ""}
                aria-pressed={method === m.key}
                onClick={() => setMethod(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        <h2 style={{ fontFamily: "var(--serif-tc)", fontSize: 20, marginBottom: 22, letterSpacing: "0.08em" }}>
          {pickupOn ? "自取資料" : cvsOn ? "取貨資料" : "收件資料"}
        </h2>
        <div className="two">
          <label className="field">
            <span className="label">姓名</span>
            <input className="input" name="recipient" required maxLength={60} autoComplete="name" />
          </label>
          <label className="field">
            <span className="label">聯絡電話</span>
            <input className="input" name="phone" required maxLength={30} inputMode="tel" autoComplete="tel" />
          </label>
        </div>
        {pickupOn ? (
          <div className="pickup-list">
            {pickupPoints.map((p) => (
              <label key={p.id} className={`pickup-choice${pickupId === p.id ? " on" : ""}`}>
                <input
                  type="radio"
                  name="pickupPointId"
                  value={p.id}
                  checked={pickupId === p.id}
                  onChange={() => setPickupId(p.id)}
                  required
                />
                <span>
                  <b>{p.name}</b>
                  {p.address && <small>{p.address}</small>}
                  {p.hours && <small>時段：{p.hours}</small>}
                  {p.note && <small>{p.note}</small>}
                </span>
              </label>
            ))}
          </div>
        ) : cvsOn ? (
          <>
            <div className="brand-switch" role="radiogroup" aria-label="超商品牌">
              {CVS_BRANDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={cvsBrand === b ? "on" : ""}
                  aria-pressed={cvsBrand === b}
                  onClick={() => setCvsBrand(b)}
                >
                  {b}
                </button>
              ))}
            </div>
            <div className="two">
              <label className="field">
                <span className="label">門市名稱</span>
                <input className="input" name="cvsStoreName" required maxLength={60} placeholder="例：台北信義門市" />
              </label>
              <label className="field">
                <span className="label">店號</span>
                <input className="input" name="cvsStoreCode" required maxLength={20} inputMode="numeric" />
              </label>
            </div>
            <span className="hint" style={{ display: "block", marginBottom: 20 }}>
              店號可在各超商的門市查詢頁或 APP 找到，請確認無誤，出貨後無法更改門市。
            </span>
          </>
        ) : (
          <label className="field">
            <span className="label">收件地址</span>
            <input className="input" name="address" required maxLength={200} autoComplete="street-address" />
          </label>
        )}
        {identity && (
          <label className="field">
            <span className="label">LINE ID（選填）</span>
            <input className="input" name="lineId" maxLength={60} />
            <span className="hint">方便我們日後搜尋與聯絡。</span>
          </label>
        )}
        <label className="field">
          <span className="label">備註</span>
          <textarea className="textarea" name="note" maxLength={300} />
        </label>
        {(onlinePay || codOn) && (
          <>
            <h2 className="sub-title">付款方式</h2>
            <div className="pickup-list">
              {onlinePay && (
                <label className={`pickup-choice${effectivePayment === "online" ? " on" : ""}`}>
                  <input type="radio" name="payment" checked={effectivePayment === "online"} onChange={() => setPayment("online")} />
                  <span>
                    <b>信用卡 / Apple Pay</b>
                    <small>送出訂單後前往藍新金流安全付款頁，付款完成即確認訂單。</small>
                  </span>
                </label>
              )}
              {codOn && (
                <label className={`pickup-choice${effectivePayment === "cod" ? " on" : ""}`}>
                  <input type="radio" name="payment" checked={effectivePayment === "cod"} onChange={() => setPayment("cod")} />
                  <span>
                    <b>超商取貨付款</b>
                    <small>到店取貨時再付款。</small>
                  </span>
                </label>
              )}
              <label className={`pickup-choice${effectivePayment === "offline" ? " on" : ""}`}>
                <input type="radio" name="payment" checked={effectivePayment === "offline"} onChange={() => setPayment("offline")} />
                <span>
                  <b>其他付款方式</b>
                  <small>送出後由我們透過 LINE 與您確認付款。</small>
                </span>
              </label>
            </div>
          </>
        )}
        {cancelDays > 0 && effectivePayment !== "cod" && (
          <div className="notice" style={{ marginBottom: 20 }}>
            訂單成立後 {cancelDays} 天內未完成付款，系統會自動取消並釋出庫存。
          </div>
        )}
        {pickupOn && selected && (
          <div className="notice" style={{ marginBottom: 20 }}>
            自取不收運費。商品備妥後我們會透過 LINE 通知您前往「{selected.name}」取貨。
          </div>
        )}
        {paymentNote && <div className="notice">{paymentNote}</div>}
      </div>

      <aside className="summary">
        <h2>Summary</h2>
        <div className="mini-lines" style={{ marginBottom: 18 }}>
          {data.lines.map((l) => (
            <div key={`${l.productId}:${l.variantId}`} className="line" style={{ gridTemplateColumns: "56px 1fr auto", gap: 14, padding: "14px 0" }}>
              <div className="frame">
                <ProductImage src={l.photo} hex={l.hex} alt={l.name} />
              </div>
              <div>
                <h3 style={{ fontSize: 14 }}>{l.name}</h3>
                <div className="variant" style={{ margin: "2px 0 0" }}>
                  <span className="dot" style={{ background: l.hex }} />
                  {l.color} × {l.qty}
                </div>
              </div>
              <div className="amount" style={{ fontSize: 16 }}>
                {formatPrice(l.price * l.qty)}
              </div>
            </div>
          ))}
        </div>
        <SummaryRows data={data} pickup={pickupOn} />
        {error && (
          <div className="notice error" style={{ marginTop: 20 }} role="alert">
            {error}
          </div>
        )}
        <button type="submit" className="btn solid" disabled={busy || blocked}>
          {busy ? "處理中…" : `${effectivePayment === "online" ? "前往付款" : "送出訂單"} · ${formatPrice(totals(data, { pickup: pickupOn }).total)}`}
        </button>
        {blocked && (
          <p style={{ fontSize: 13, color: "var(--alert)", margin: "12px 0 0" }}>
            部分商品庫存不足，請回{" "}
            <Link href="/cart" className="link">
              購物袋
            </Link>{" "}
            調整。
          </p>
        )}
      </aside>
    </form>
  );
}
