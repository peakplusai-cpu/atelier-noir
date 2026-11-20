import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PdpClient from "@/components/PdpClient";
import ProductCard from "@/components/ProductCard";
import { loadPublicShop } from "@/lib/expire-checkouts";
import { publishedProducts } from "@/lib/shop";
import { siteOrigin } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = publishedProducts(await loadPublicShop()).find((item) => item.slug === slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.tagline} ${p.description}`.slice(0, 200),
    openGraph: { title: p.name, description: p.tagline },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const live = publishedProducts(await loadPublicShop());
  const product = live.find((item) => item.slug === slug);
  if (!product) notFound();

  const look = product.lookWith.map((s) => live.find((item) => item.slug === s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand || "CLACK" },
    offers: {
      "@type": "Offer",
      url: `${siteOrigin()}/products/${product.slug}`,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <section className="page page-pdp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <PdpClient product={product} />
      {look.length > 0 && (
        <div className="look section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Complete the look</p>
              <h2 className="serif">Wear it with</h2>
            </div>
          </div>
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
