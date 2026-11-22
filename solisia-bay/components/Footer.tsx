import Link from "next/link";
import { t } from "@/lib/i18n";
import { getMarket } from "@/lib/market-server";
import { SITE } from "@/lib/site";

export default async function Footer() {
  const { lang } = await getMarket();
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <p className="logo logo-footer">
            <img src="/clack-logo.png" alt="CLACK" />
          </p>
        </div>
        <div>
          <h4>{t(lang, "shop")}</h4>
          <Link href="/collection/women">{t(lang, "navWomen")}</Link>
          <Link href="/collection/men">{t(lang, "navMen")}</Link>
          <Link href="/collection/all">{t(lang, "navAll")}</Link>
        </div>
        <div>
          <h4>{t(lang, "help")}</h4>
          <Link href="/policies/shipping-returns">{t(lang, "shippingReturns")}</Link>
          <Link href="/policies/size-guide">{t(lang, "sizeGuide")}</Link>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <Link href="/admin" className="staff-entry">
            {t(lang, "staff")}
          </Link>
        </div>
        <div>
          <h4>{t(lang, "checkoutTitle")}</h4>
          <p className="footer-note">{t(lang, "paypalNote")}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} CLACK</p>
        <p>{t(lang, "pricedIn")}</p>
      </div>
    </footer>
  );
}
