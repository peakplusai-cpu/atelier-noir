"use client";

import { useRouter } from "next/navigation";
import { SWITCH_CURRENCIES } from "@/lib/currency";
import { t } from "@/lib/i18n";
import { PREF_COOKIE, type Lang } from "@/lib/market";
import { useMarket } from "./MarketProvider";

export function LocaleSwitch() {
  const market = useMarket();
  const router = useRouter();

  function write(lang: Lang, currency: string) {
    document.cookie = `${PREF_COOKIE}=${lang}.${currency}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="locale-switch" role="group" aria-label={t(market.lang, "localeSwitch")}>
      <button type="button" data-active={market.lang === "zh"} aria-pressed={market.lang === "zh"} onClick={() => write("zh", market.currency)}>
        中文
      </button>
      <button type="button" data-active={market.lang === "en"} aria-pressed={market.lang === "en"} onClick={() => write("en", market.currency)}>
        EN
      </button>
      <select aria-label={t(market.lang, "currency")} value={market.currency} onChange={(event) => write(market.lang, event.target.value)}>
        {SWITCH_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </div>
  );
}
