import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PdpClient from "@/components/PdpClient";
import ProductCard from "@/components/ProductCard";
import { loadPublicShop } from "@/lib/expire-checkouts";
import { currencyDecimals } from "@/lib/currency";
import { convertAmount, getRates } from "@/lib/fx";
import { localizedDescription, localizedName } from "@/lib/i18n";
import { getMarket } from "@/lib/market-server";
import { publishedProducts } from "@/lib/shop";
import { siteOrigin } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = publishedProducts(await loadPublicShop()).find((item) => item.slug === slug);
  if (!p) return {};
  const market = await getMarket();
  const name = localizedName(p, market.lang);
  const description = localizedDescription(p, market.lang).slice(0, 200);
  return {
    title: name,
    description,
    openGraph: { title: name, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [liveShop, market, rates] = await Promise.all([loadPublicShop(), getMarket(), getRates()]);
  const live = publishedProducts(liveShop);
  const product = live.find((item) => item.slug === slug);
  if (!product) notFound();

  const look = product.lookWith.map((s) => live.find((item) => item.slug === s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const price = convertAmount(product.price, market.currency, rates);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: localizedName(product, market.lang),
    description: localizedDescription(product, market.lang),
    brand: { "@type": "Brand", name: product.brand || "CLACK" },
    offers: {
      "@type": "Offer",
      url: `${siteOrigin()}/products/${product.slug}`,
      priceCurrency: market.currency,
      price: price.toFixed(currencyDecimals(market.currency)),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <section className="page page-pdp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <PdpClient product={product} />
      {look.length > 0 && (
        <div className="look section">
          <div className="grid grid-3">
            {look.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
