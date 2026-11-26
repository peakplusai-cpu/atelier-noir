"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { SITE } from "@/lib/site";
import { useCart } from "./CartProvider";
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
  const threshold = freeShipping;
  const menuRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMenu(false), [pathname]);

  useEffect(() => {
    if (!menu) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        return;
      }
      if (event.key !== "Tab" || !menuRef.current) return;
      const items = [...menuRef.current.querySelectorAll<HTMLElement>("a, button, select")].filter((item) => !item.hasAttribute("disabled"));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      (previous && previous !== closeRef.current ? previous : openRef.current)?.focus?.();
    };
  }, [menu]);

  return (
    <div className="chrome">
      <div className="announce">
        <p>{announcement || t(lang, "freeOver", { amount: formatMoney(threshold, "TWD", "zh") })}</p>
      </div>
      <header className="header">
        <div className="header-inner">
          <button
            ref={openRef}
            type="button"
            className="icon-btn menu-btn"
            aria-label={t(lang, "openMenu")}
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M3 7h16M3 15h16" />
            </svg>
          </button>
          <nav className="nav" aria-label={t(lang, "primary")}>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} data-active={pathname === item.href}>
                {t(lang, item.key)}
              </Link>
            ))}
          </nav>
          <Link href="/" className="logo" aria-label="CLACK home">
            <Image src="/clack-logo.png" alt="" width={528} height={530} priority sizes="(max-width: 900px) 140px, 220px" />
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
      <div
        ref={menuRef}
        className="mobile-nav"
        data-open={menu}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menu}
        aria-label={t(lang, "openMenu")}
      >
        <div className="mobile-nav-bar">
          <button ref={closeRef} type="button" className="icon-btn" aria-label={t(lang, "closeMenu")} onClick={() => setMenu(false)}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M5 5l12 12M17 5L5 17" />
            </svg>
          </button>
        </div>
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} tabIndex={menu ? 0 : -1} data-active={pathname === item.href}>
            {t(lang, item.key)}
          </Link>
        ))}
        <Link href="/policies/shipping-returns" className="mobile-small" tabIndex={menu ? 0 : -1}>
          {t(lang, "shippingReturns")}
        </Link>
        <Link href="/policies/size-guide" className="mobile-small" tabIndex={menu ? 0 : -1}>
          {t(lang, "sizeGuide")}
        </Link>
        <a className="mobile-small" href={`mailto:${SITE.email}`} tabIndex={menu ? 0 : -1}>
          {SITE.email}
        </a>
        <Link href="/admin" className="mobile-small staff-nav" tabIndex={menu ? 0 : -1}>
          {t(lang, "staff")}
        </Link>
      </div>
    </div>
  );
}
