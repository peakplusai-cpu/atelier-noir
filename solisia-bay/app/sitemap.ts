import type { MetadataRoute } from "next";
import { COLLECTIONS, products } from "@/lib/catalog";
import { siteOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    ...Object.keys(COLLECTIONS).map((h) => ({ url: `${origin}/collection/${h}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${origin}/products/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...["shipping-returns", "swimwear-hygiene", "size-guide"].map((s) => ({ url: `${origin}/policies/${s}`, priority: 0.3 })),
  ];
}
