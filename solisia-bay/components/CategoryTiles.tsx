import Link from "next/link";
import ProductImage from "./ProductImage";
import { getShop, publishedProducts } from "@/lib/shop";

const TILES = [
  { href: "/collection/women", label: "女裝 Women", slug: "clack-box-tee" },
  { href: "/collection/men", label: "男裝 Men", slug: "clack-oxford-shirt" },
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
