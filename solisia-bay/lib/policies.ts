import { t } from "./i18n";
import type { Lang } from "./market";
import { SITE } from "./site";

export function shippingCopy(lang: Lang, threshold: string, flat: string): string[] {
  return [t(lang, "shipRate", { threshold, flat }), t(lang, "shipWindow"), t(lang, "duties")];
}

export function returnsCopy(lang: Lang): string[] {
  return [
    t(lang, "returnsBody", { days: SITE.returnDays }),
    t(lang, "returnsStart", { email: SITE.email }),
  ];
}
