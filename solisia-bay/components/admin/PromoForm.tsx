"use client";

import Link from "next/link";
import { useActionState } from "react";
import { savePromotion } from "@/app/actions/catalog";
import type { Promotion } from "@/lib/promos";
import type { Product } from "@/lib/types";

function taipeiInput(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "";
  return new Date(parsed + 8 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function PromoForm({ promo, products }: { promo?: Promotion; products: Product[] }) {
  const [error, action, pending] = useActionState(savePromotion, "");
  const start = promo ? taipeiInput(promo.startsAt) : "";
  const end = promo ? taipeiInput(promo.endsAt) : "";
  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="id" value={promo?.id ?? ""} />
      <section className="admin-panel">
        <label className="field"><span>名稱</span><input name="name" defaultValue={promo?.name ?? ""} required maxLength={80} /></label>
        <label className="field"><span>優惠碼（留白則自動套用）</span><input name="code" defaultValue={promo?.code ?? ""} maxLength={24} /></label>
        <div className="field-row">
          <label className="field"><span>類型</span>
            <select name="kind" defaultValue={promo?.kind ?? "percent"}>
              <option value="percent">百分比</option>
              <option value="amount">固定金額 USD</option>
              <option value="shipping">免運</option>
            </select>
          </label>
          <label className="field"><span>折扣值</span><input name="value" type="number" min={0} step="0.01" defaultValue={promo?.value ?? 10} /></label>
          <label className="field"><span>最低消費</span><input name="minSubtotal" type="number" min={0} step="0.01" defaultValue={promo?.minSubtotal ?? 0} /></label>
        </div>
        <div className="field-row">
          <label className="field"><span>範圍</span>
            <select name="scope" defaultValue={promo?.scope ?? "all"}>
              <option value="all">全站</option>
              <option value="gender">分類</option>
              <option value="product">指定商品</option>
            </select>
          </label>
          <label className="field"><span>分類</span>
            <select name="gender" defaultValue={promo?.gender || "women"}>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="couples">Couples</option>
            </select>
          </label>
          <label className="field"><span>商品</span>
            <select name="slug" defaultValue={promo?.slug ?? ""}>
              <option value="">—</option>
              {products.map((product) => <option key={product.slug} value={product.slug}>{product.name}</option>)}
            </select>
          </label>
        </div>
        <div className="field-row">
          <label className="field"><span>開始（台北）</span><input name="startsAt" type="datetime-local" defaultValue={start} required /></label>
          <label className="field"><span>結束（台北）</span><input name="endsAt" type="datetime-local" defaultValue={end} required /></label>
          <label className="field"><span>次數上限（0 不限）</span><input name="usageLimit" type="number" min={0} step={1} defaultValue={promo?.usageLimit ?? 0} /></label>
        </div>
        <label className="check"><input type="checkbox" name="enabled" defaultChecked={promo?.enabled ?? true} /> 啟用</label>
        {promo && <p className="fine">已使用 {promo.used} 次</p>}
      </section>
      {error && <p className="form-error">{error}</p>}
      <div className="staff-actions">
        <button className="btn btn-solid" disabled={pending}>{pending ? "儲存中…" : "儲存優惠"}</button>
        <Link href="/admin/promotions" className="btn btn-outline">取消</Link>
      </div>
    </form>
  );
}
