import Link from "next/link";
import ProductImage from "./ProductImage";
import { getShop, publishedProducts } from "@/lib/shop";

const TILES = [
  { href: "/collection/women", label: "Shop Women", sub: "Swim, separates & cover-ups", slug: "amalfi-plunge-one-piece" },
  { href: "/collection/men", label: "Shop Men", sub: "Cuban collar & Miami resort", slug: "havana-cuban-collar-shirt" },
  { href: "/collection/couples", label: "Couples Sets", sub: "Pieces for two, priced together", slug: "amalfi-couples-set" },
];

export default async function CategoryTiles() {
  const live = publishedProducts(await getShop());
  return (
    <section id="entry" className="section tiles">
      <div className="tiles-grid">
        {TILES.map((t) => {
          const p = live.find((item) => item.slug === t.slug);
          if (!p) return null;
          return (
            <Link key={t.href} href={t.href} className="tile">
              <div className="tile-media">
                <ProductImage product={p} view="front" />
              </div>
              <div className="tile-label">
                <span className="serif">{t.label}</span>
                <small>{t.sub}</small>
                <span className="tile-arrow" aria-hidden>
                  &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
