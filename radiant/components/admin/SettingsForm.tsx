"use client";

import { useActionState, useState } from "react";
import { saveSettings, testPush } from "@/app/actions/admin";
import type { PickupPoint, Settings } from "@/lib/types";

type PointDraft = PickupPoint & { key: string };

let pointN = 0;
const nextPointKey = () => `pk${++pointN}`;

type Props = {
  settings: Omit<Settings, "secret" | "loginChannelSecret" | "messagingToken" | "payHashKey" | "payHashIV">;
  pay: {
    ready: boolean;
    mode: "test" | "live";
    hasKeys: boolean;
    keysFromEnv: boolean;
    merchantFromEnv: boolean;
    modeFromEnv: boolean;
    notifyUrl: string;
    returnUrl: string;
  };
  hasLoginSecret: boolean;
  hasMessagingToken: boolean;
  callbackUrl: string;
  loginReady: boolean;
};

export function SettingsForm({ settings, hasLoginSecret, hasMessagingToken, callbackUrl, loginReady, pay }: Props) {
  const [message, action, pending] = useActionState(saveSettings, "");
  const [testMessage, testAction, testing] = useActionState(testPush, "");
  const [points, setPoints] = useState<PointDraft[]>(() =>
    (settings.pickupPoints ?? []).map((p) => ({ ...p, key: nextPointKey() }))
  );

  function patchPoint(key: string, patch: Partial<PointDraft>) {
    setPoints((list) => list.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  return (
    <>
      <form action={action}>
        <input
          type="hidden"
          name="pickupPoints"
          value={JSON.stringify(
            points.map((p) => ({ id: p.id, name: p.name, address: p.address, hours: p.hours, note: p.note, enabled: p.enabled }))
          )}
        />
        <div className="form-grid">
          <div>
            <section className="panel">
              <h2>
                LINE 官方帳號
                <small>顯示在前台頁尾與訂單完成頁，讓客戶加入好友。</small>
              </h2>
              <label className="field">
                <span className="label">官方帳號名稱</span>
                <input className="input" name="lineOaName" defaultValue={settings.lineOaName} maxLength={60} />
              </label>
              <label className="field">
                <span className="label">Basic ID</span>
                <input className="input" name="lineOaBasicId" defaultValue={settings.lineOaBasicId} placeholder="@123abcde" maxLength={60} />
              </label>
              <label className="field">
                <span className="label">加入好友連結</span>
                <input className="input" name="lineOaUrl" defaultValue={settings.lineOaUrl} placeholder="https://lin.ee/xxxxxxx" maxLength={200} />
                <span className="hint">在 LINE Official Account Manager →「增加好友」→ 取得網址。</span>
              </label>
            </section>

            <section className="panel">
              <h2>
                LINE 登入（結帳辨識身分）
                <small>
                  狀態：<b style={{ color: loginReady ? "var(--teal-deep)" : "var(--alert)" }}>{loginReady ? "已啟用，結帳需 LINE 登入" : "未設定，結帳時由客戶自行填寫"}</b>
                </small>
              </h2>
              <label className="field">
                <span className="label">Channel ID</span>
                <input className="input" name="loginChannelId" defaultValue={settings.loginChannelId} maxLength={40} inputMode="numeric" />
              </label>
              <label className="field">
                <span className="label">Channel secret</span>
                <input className="input" name="loginChannelSecret" type="password" autoComplete="off" placeholder={hasLoginSecret ? "已設定，留白表示不變更" : ""} maxLength={80} />
                {hasLoginSecret && (
                  <label className="toggle" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
                    <input type="checkbox" name="clearLoginSecret" />
                    <span>清除已儲存的 Channel secret</span>
                  </label>
                )}
              </label>
              <div className="notice" style={{ marginBottom: 28 }}>
                請在 LINE Developers 的 LINE Login channel 中，將下列網址加入 Callback URL，並把 channel 與官方帳號連結，客戶登入時才會被引導加入好友：
                <div className="mono" style={{ marginTop: 8 }}>{callbackUrl}</div>
              </div>
            </section>

            <section className="panel">
              <h2>
                LINE 推播通知
                <small>新訂單時通知店家，並回覆客戶訂單確認（客戶需已加入官方帳號好友）。</small>
              </h2>
              <label className="field">
                <span className="label">Messaging API channel access token</span>
                <input className="input" name="messagingToken" type="password" autoComplete="off" placeholder={hasMessagingToken ? "已設定，留白表示不變更" : ""} maxLength={400} />
                {hasMessagingToken && (
                  <label className="toggle" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
                    <input type="checkbox" name="clearMessagingToken" />
                    <span>清除已儲存的權杖</span>
                  </label>
                )}
              </label>
              <label className="field">
                <span className="label">店家通知對象（User ID 或 Group ID）</span>
                <input className="input" name="notifyTo" defaultValue={settings.notifyTo} placeholder="Uxxxxxxxx…" maxLength={80} />
                <span className="hint">店家員工的 LINE User ID（需已加好友）。留白則不通知店家。</span>
              </label>
            </section>
          </div>

          <div>
            <section className="panel">
              <h2>商店資訊</h2>
              <label className="field">
                <span className="label">商店名稱</span>
                <input className="input" name="shopName" defaultValue={settings.shopName} maxLength={40} />
              </label>
              <label className="field">
                <span className="label">首頁文案</span>
                <textarea className="textarea" name="tagline" defaultValue={settings.tagline} maxLength={120} />
              </label>
              <label className="field">
                <span className="label">頂部公告</span>
                <input className="input" name="announcement" defaultValue={settings.announcement} maxLength={160} />
                <span className="hint">留白則不顯示。</span>
              </label>
            </section>

            <section className="panel">
              <h2>運費與付款</h2>
              <div className="two">
                <label className="field">
                  <span className="label">運費 NT$</span>
                  <input className="input" type="number" min={0} name="shippingFee" defaultValue={settings.shippingFee} />
                </label>
                <label className="field">
                  <span className="label">免運門檻 NT$</span>
                  <input className="input" type="number" min={0} name="freeShippingThreshold" defaultValue={settings.freeShippingThreshold} />
                </label>
              </div>
              <label className="field">
                <span className="label">付款說明</span>
                <textarea className="textarea" name="paymentNote" defaultValue={settings.paymentNote} maxLength={600} />
                <span className="hint">顯示在結帳頁與訂單完成頁，例如匯款帳號或收款方式。</span>
              </label>
              <label className="field">
                <span className="label">未付款自動取消（天）</span>
                <input className="input" type="number" min={0} max={60} name="unpaidCancelDays" defaultValue={settings.unpaidCancelDays} />
                <span className="hint">
                  訂單成立後超過這個天數仍是「待確認」且未付款，系統會自動取消、釋出庫存並用 LINE 通知客戶。填 0 表示不自動取消。超商取貨付款的訂單不受影響。
                </span>
              </label>
            </section>

            <section className="panel">
              <h2>
                線上付款（藍新金流）
                <small>
                  狀態：
                  <b style={{ color: pay.ready ? "var(--teal-deep)" : "var(--alert)" }}>
                    {pay.ready ? `已啟用（${pay.mode === "live" ? "正式環境" : "測試環境"}）` : "未啟用"}
                  </b>
                </small>
              </h2>
              <label className="toggle">
                <input type="checkbox" name="payOnlineEnabled" defaultChecked={settings.payOnlineEnabled} />
                <span>開放信用卡 / Apple Pay 線上付款</span>
              </label>
              <label className="field">
                <span className="label">環境</span>
                <select className="input" name="payMode" defaultValue={pay.mode} disabled={pay.modeFromEnv}>
                  <option value="test">測試環境（不會真的扣款）</option>
                  <option value="live">正式環境</option>
                </select>
                {pay.modeFromEnv && <span className="hint">目前由 Vercel 環境變數 NEWEBPAY_MODE 指定。</span>}
              </label>
              <label className="field">
                <span className="label">商店代號 MerchantID</span>
                <input className="input" name="payMerchantId" defaultValue={settings.payMerchantId} maxLength={40} disabled={pay.merchantFromEnv} />
                {pay.merchantFromEnv && <span className="hint">目前由環境變數 NEWEBPAY_MERCHANT_ID 提供。</span>}
              </label>
              <div className="two">
                <label className="field">
                  <span className="label">HashKey（32 字元）</span>
                  <input className="input" name="payHashKey" type="password" autoComplete="off" maxLength={80} disabled={pay.keysFromEnv} placeholder={pay.hasKeys ? "已設定，留白表示不變更" : ""} />
                </label>
                <label className="field">
                  <span className="label">HashIV（16 字元）</span>
                  <input className="input" name="payHashIV" type="password" autoComplete="off" maxLength={80} disabled={pay.keysFromEnv} placeholder={pay.hasKeys ? "已設定，留白表示不變更" : ""} />
                </label>
              </div>
              {pay.keysFromEnv ? (
                <div className="hint" style={{ marginBottom: 20 }}>HashKey / HashIV 目前由 Vercel 環境變數提供，不會顯示在這裡。</div>
              ) : (
                pay.hasKeys && (
                  <label className="toggle" style={{ fontSize: 13 }}>
                    <input type="checkbox" name="clearPayKeys" />
                    <span>清除已儲存的 HashKey / HashIV</span>
                  </label>
                )
              )}
              <div className="notice" style={{ marginBottom: 20 }}>
                測試環境與正式環境的商店代號與金鑰不同，切換環境時請一併更換。金鑰只會存在伺服器，不會傳回瀏覽器；較建議放在 Vercel 的環境變數（NEWEBPAY_MERCHANT_ID、NEWEBPAY_HASH_KEY、NEWEBPAY_HASH_IV）。
                <div className="mono" style={{ marginTop: 8 }}>付款通知網址：{pay.notifyUrl}</div>
                <div className="mono" style={{ marginTop: 4 }}>付款返回網址：{pay.returnUrl}</div>
              </div>
            </section>

            <section className="panel">
              <h2>
                超商取貨
                <small>客戶可選 7-ELEVEN / 全家 / 萊爾富，並填寫門市名稱與店號。目前出貨由店家手動處理，運費沿用上方設定。</small>
              </h2>
              <label className="toggle">
                <input type="checkbox" name="cvsEnabled" defaultChecked={settings.cvsEnabled} />
                <span>開放超商取貨</span>
              </label>
              <label className="toggle">
                <input type="checkbox" name="cvsCodEnabled" defaultChecked={settings.cvsCodEnabled} />
                <span>允許「取貨付款」（到店取貨時才付款）</span>
              </label>
            </section>

            <section className="panel">
              <h2>
                自取地點
                <small>至少有一個啟用中的地點，結帳頁才會出現自取選項。自取不收運費。</small>
              </h2>
              {points.map((p, i) => (
                <div key={p.key} className="point-card">
                  <div className="point-card-head">
                    <span>地點 {i + 1}</span>
                    <button type="button" className="btn small danger" onClick={() => setPoints((list) => list.filter((x) => x.key !== p.key))}>
                      刪除
                    </button>
                  </div>
                  <label className="field">
                    <span className="label">名稱</span>
                    <input
                      className="input"
                      value={p.name}
                      onChange={(e) => patchPoint(p.key, { name: e.target.value })}
                      placeholder="例如：大安門市、7-ELEVEN 某某門市"
                      maxLength={80}
                    />
                  </label>
                  <label className="field">
                    <span className="label">地址或位置說明</span>
                    <input
                      className="input"
                      value={p.address}
                      onChange={(e) => patchPoint(p.key, { address: e.target.value })}
                      maxLength={200}
                    />
                  </label>
                  <label className="field">
                    <span className="label">可取時段（選填）</span>
                    <input
                      className="input"
                      value={p.hours}
                      onChange={(e) => patchPoint(p.key, { hours: e.target.value })}
                      placeholder="例如：平日 12:00–20:00"
                      maxLength={80}
                    />
                  </label>
                  <label className="field">
                    <span className="label">備註（選填）</span>
                    <input
                      className="input"
                      value={p.note}
                      onChange={(e) => patchPoint(p.key, { note: e.target.value })}
                      maxLength={160}
                    />
                  </label>
                  <label className="toggle" style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => patchPoint(p.key, { enabled: e.target.checked })}
                    />
                    <span>開放自取</span>
                  </label>
                </div>
              ))}
              {points.length < 20 && (
                <button
                  type="button"
                  className="btn small"
                  onClick={() =>
                    setPoints((list) => [
                      ...list,
                      { key: nextPointKey(), id: "", name: "", address: "", hours: "", note: "", enabled: true },
                    ])
                  }
                >
                  新增自取點
                </button>
              )}
            </section>
          </div>
        </div>

        <div className="savebar">
          <button className="btn solid" disabled={pending}>
            {pending ? "儲存中…" : "儲存設定"}
          </button>
          {message && <span style={{ color: "var(--teal-deep)", fontSize: 14 }} role="status">{message}</span>}
        </div>
      </form>

      <form action={testAction} style={{ marginTop: 28, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn small" disabled={testing}>
          {testing ? "發送中…" : "發送 LINE 測試訊息"}
        </button>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>請先儲存設定，再測試推播。</span>
        {testMessage && <span style={{ fontSize: 14 }} role="status">{testMessage}</span>}
      </form>
    </>
  );
}
