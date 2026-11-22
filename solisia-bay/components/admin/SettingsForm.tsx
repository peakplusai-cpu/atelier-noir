"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/actions/catalog";
import type { ShopSettings } from "@/lib/shop-public";

export function SettingsForm({ settings }: { settings: ShopSettings }) {
  const [message, action, pending] = useActionState(saveSettings, "");
  return (
    <form action={action} className="admin-form">
      <section className="admin-panel">
        <label className="field"><span>公告列</span><input name="announcement" defaultValue={settings.announcement} maxLength={180} /></label>
        <div className="field-row">
          <label className="field"><span>免運門檻 TWD</span><input name="freeShippingThreshold" type="number" min={1} step="0.01" defaultValue={settings.freeShippingThreshold} required /></label>
          <label className="field"><span>未達標運費 TWD</span><input name="flatShipping" type="number" min={0} step="0.01" defaultValue={settings.flatShipping} required /></label>
        </div>
        <label className="field"><span>客服信箱</span><input name="email" type="email" defaultValue={settings.email} required /></label>
        <p className="fine">PayPal 與 Supabase 金鑰仍放在環境變數，不會寫進這裡。</p>
      </section>
      {message && <p className="fine">{message}</p>}
      <button className="btn btn-solid" disabled={pending}>{pending ? "儲存中…" : "儲存設定"}</button>
    </form>
  );
}
