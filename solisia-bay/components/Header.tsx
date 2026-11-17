"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/collection/women", label: "Women" },
  { href: "/collection/men", label: "Men" },
  { href: "/collection/couples", label: "Couples Sets" },
  { href: "/collection/all", label: "Shop All" },
];

export default function Header() {
  const pathname = usePathname();
  const { count, openCart, ready } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const overlay = pathname === "/" && !scrolled && !menu;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  return (
    <div className="chrome">
      <div className="announce">
        <p>
          Free worldwide shipping on orders over ${SITE.freeShippingThreshold} USD
          <span className="hide-sm"> &nbsp;·&nbsp; Easy {SITE.returnDays}-day returns</span>
        </p>
      </div>
      <header className="header" data-overlay={overlay}>
        <div className="header-inner">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
              {menu ? <path d="M5 5l12 12M17 5L5 17" /> : <path d="M3 7h16M3 15h16" />}
            </svg>
          </button>
          <nav className="nav" aria-label="Primary">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} data-active={pathname === n.href}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="logo" aria-label="SOLISIA BAY home">
            SOLISIA <span>BAY</span>
          </Link>
          <div className="header-actions">
            <Link href="/admin" className="nav-link-small staff-nav">
              員工入口
            </Link>
            <Link href="/policies/shipping-returns" className="nav-link-small">
              Shipping &amp; Returns
            </Link>
            <button type="button" className="icon-btn cart-btn" aria-label={`Open cart, ${count} items`} onClick={openCart}>
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
            {n.label}
          </Link>
        ))}
        <Link href="/policies/shipping-returns" className="mobile-small" tabIndex={menu ? 0 : -1}>
          Shipping &amp; Returns
        </Link>
        <Link href="/admin" className="mobile-small staff-nav" tabIndex={menu ? 0 : -1}>
          員工入口
        </Link>
      </div>
    </div>
  );
}
