import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { CatalogProvider } from "@/components/CatalogProvider";
import { MarketProvider } from "@/components/MarketProvider";
import { StoreChrome } from "@/components/StoreChrome";
import { loadPublicShop } from "@/lib/expire-checkouts";
import { getRates } from "@/lib/fx";
import { getMarket } from "@/lib/market-server";
import { publishedProducts } from "@/lib/shop";
import { SITE, siteOrigin } from "@/lib/site";

const sans = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  description: "CLACK",
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: "CLACK",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [shop, market, rates] = await Promise.all([loadPublicShop(), getMarket(), getRates()]);
  return (
    <html lang={market.lang === "zh" ? "zh-Hant" : "en"} className={sans.variable}>
      <body>
        <MarketProvider value={{ ...market, rates }}>
          <CatalogProvider value={{ products: publishedProducts(shop), settings: shop.settings }}>
            <CartProvider>
              <StoreChrome announcement={shop.settings.announcement} freeShipping={shop.settings.freeShippingThreshold}>
                {children}
              </StoreChrome>
            </CartProvider>
          </CatalogProvider>
        </MarketProvider>
      </body>
    </html>
  );
}
