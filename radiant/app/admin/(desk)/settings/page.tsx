import { getStore } from "@/lib/store";
import { lineConfig, lineLoginEnabled, siteOrigin } from "@/lib/line";
import { payConfig } from "@/lib/newebpay";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const { settings } = await getStore();
  const cfg = lineConfig(settings);
  const pay = payConfig(settings);
  const {
    secret: _s,
    loginChannelSecret: _l,
    messagingToken: _m,
    payHashKey: _k,
    payHashIV: _v,
    ...safe
  } = settings;
  void _s;
  void _l;
  void _m;
  void _k;
  void _v;
  const origin = await siteOrigin();
  return (
    <>
      <div className="admin-head">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>設定</h1>
        </div>
      </div>
      <SettingsForm
        settings={safe}
        hasLoginSecret={Boolean(cfg.loginSecret)}
        hasMessagingToken={Boolean(cfg.messagingToken)}
        callbackUrl={`${origin}/api/line/callback`}
        pay={{
          ready: pay.ready,
          mode: pay.mode,
          hasKeys: pay.hashKey.length === 32 && pay.hashIV.length === 16,
          keysFromEnv: pay.fromEnv.hashKey && pay.fromEnv.hashIV,
          merchantFromEnv: pay.fromEnv.merchantId,
          modeFromEnv: pay.fromEnv.mode,
          notifyUrl: `${origin}/api/payment/newebpay/notify`,
          returnUrl: `${origin}/api/payment/newebpay/return`,
        }}
        loginReady={lineLoginEnabled(settings)}
      />
    </>
  );
}
