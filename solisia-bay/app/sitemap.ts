import type { MetadataRoute } from "next";
import { COLLECTIONS } from "@/lib/catalog";
import { getShop, publishedProducts } from "@/lib/shop";
import { siteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const products = publishedProducts(await getShop());
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    ...Object.keys(COLLECTIONS).map((h) => ({ url: `${origin}/collection/${h}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${origin}/products/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...["shipping-returns", "swimwear-hygiene", "size-guide"].map((s) => ({ url: `${origin}/policies/${s}`, priority: 0.3 })),
  ];
}
