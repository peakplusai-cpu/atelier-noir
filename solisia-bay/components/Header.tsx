"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { convertAmount } from "@/lib/fx";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { SITE } from "@/lib/site";
import { useCart } from "./CartProvider";
import { LocaleSwitch } from "./LocaleSwitch";
import { useMarket } from "./MarketProvider";

const NAV = [
  { href: "/collection/women", key: "navWomen" },
  { href: "/collection/men", key: "navMen" },
  { href: "/collection/all", key: "navAll" },
] as const;

export default function Header({ announcement = "", freeShipping = SITE.freeShippingThreshold }: { announcement?: string; freeShipping?: number }) {
  const pathname = usePathname();
  const { count, openCart, ready } = useCart();
  const market = useMarket();
  const [menu, setMenu] = useState(false);
  const lang = market.lang;
  const threshold = convertAmount(freeShipping, market.currency, market.rates);

  useEffect(() => setMenu(false), [pathname]);

  return (
    <div className="chrome">
      <div className="announce">
        <p>{announcement || t(lang, "freeOver", { amount: formatMoney(threshold, market.currency, lang) })}</p>
        <LocaleSwitch />
      </div>
      <header className="header">
        <div className="header-inner">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label={menu ? t(lang, "closeMenu") : t(lang, "openMenu")}
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
              {menu ? <path d="M5 5l12 12M17 5L5 17" /> : <path d="M3 7h16M3 15h16" />}
            </svg>
          </button>
          <nav className="nav" aria-label={t(lang, "primary")}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} data-active={pathname === n.href}>
                {t(lang, n.key)}
              </Link>
            ))}
          </nav>
          <Link href="/" className="logo" aria-label="CLACK home">
            <img src="/clack-logo.png" alt="" />
          </Link>
          <div className="header-actions">
            <Link href="/admin" className="nav-link-small staff-nav">
              {t(lang, "staff")}
            </Link>
            <Link href="/policies/shipping-returns" className="nav-link-small">
              {t(lang, "shippingLink")}
            </Link>
            <button type="button" className="icon-btn cart-btn" aria-label={t(lang, "openCart", { count })} onClick={openCart}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M4 7h14l-1 12H5L4 7z" />
                <path d="M8 7V5.5a3 3 0 016 0V7" />
              </svg>
              {ready && count > 0 && <span className="cart-count">{count}</span>}
            </button>
          </div>
        </div>
      </header>
      <div className="mobile-nav" data-open={menu} aria-hidden={!menu}>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} tabIndex={menu ? 0 : -1}>
            {t(lang, n.key)}
          </Link>
        ))}
        <Link href="/policies/shipping-returns" className="mobile-small" tabIndex={menu ? 0 : -1}>
          {t(lang, "shippingReturns")}
        </Link>
        <Link href="/admin" className="mobile-small staff-nav" tabIndex={menu ? 0 : -1}>
          {t(lang, "staff")}
        </Link>
      </div>
    </div>
  );
}
