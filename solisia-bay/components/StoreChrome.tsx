import type { ReactNode } from "react";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import Header from "./Header";

export function StoreChrome({
  children,
  announcement,
  freeShipping,
}: {
  children: ReactNode;
  announcement: string;
  freeShipping: number;
}) {
  return (
    <>
      <Header announcement={announcement} freeShipping={freeShipping} />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
