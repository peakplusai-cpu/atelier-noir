import type { Metadata, Viewport } from "next";
import { Anton, Noto_Sans_TC, Permanent_Marker } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { CatalogProvider } from "@/components/CatalogProvider";
import { StoreChrome } from "@/components/StoreChrome";
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
  description: "CLACK",
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} | Streetwear Select Shop`,
    description: "CLACK",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const shop = await loadPublicShop();
  return (
    <html lang="zh-Hant" className={`${display.variable} ${marker.variable} ${sans.variable}`}>
      <body>
        <CatalogProvider value={{ products: publishedProducts(shop), settings: shop.settings }}>
          <CartProvider>
            <StoreChrome announcement={shop.settings.announcement} freeShipping={shop.settings.freeShippingThreshold}>
              {children}
            </StoreChrome>
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
