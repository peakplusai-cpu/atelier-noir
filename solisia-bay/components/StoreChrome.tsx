"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import Header from "./Header";

/** Home is a blank white mark. Every other route keeps the existing shop chrome. */
export function StoreChrome({
  children,
  announcement,
  freeShipping,
}: {
  children: ReactNode;
  announcement: string;
  freeShipping: number;
}) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  return (
    <>
      <Header announcement={announcement} freeShipping={freeShipping} />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
