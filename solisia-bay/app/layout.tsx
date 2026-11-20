import type { Metadata, Viewport } from "next";
import { Anton, Noto_Sans_TC, Permanent_Marker } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { CatalogProvider } from "@/components/CatalogProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { loadPublicShop } from "@/lib/expire-checkouts";
import { publishedProducts } from "@/lib/shop";
import { SITE, siteOrigin } from "@/lib/site";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});
const marker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marker",
  display: "swap",
});
const sans = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: { default: `${SITE.name} | Streetwear Select Shop`, template: `%s | ${SITE.name}` },
  description: `${SITE.name}. ${SITE.tagline}`,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} | Streetwear Select Shop`,
    description: SITE.tagline,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const shop = await loadPublicShop();
  return (
    <html lang="zh-Hant" className={`${display.variable} ${marker.variable} ${sans.variable}`}>
      <body>
        <CatalogProvider value={{ products: publishedProducts(shop), settings: shop.settings }}>
          <CartProvider>
            <Header announcement={shop.settings.announcement} freeShipping={shop.settings.freeShippingThreshold} />
            <main id="main">{children}</main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
