"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "總覽", exact: true },
  { href: "/admin/products", label: "商品" },
  { href: "/admin/promotions", label: "優惠" },
  { href: "/admin/wall", label: "動態牆" },
  { href: "/admin/orders", label: "訂單" },
  { href: "/admin/customers", label: "客戶" },
  { href: "/admin/settings", label: "設定" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="admin-nav" aria-label="後台選單">
      {ITEMS.map((item) => {
        const on = item.exact ? path === item.href : path.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} data-active={on}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
