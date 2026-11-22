import Link from "next/link";
import ProductImage from "./ProductImage";
import { t, type MessageKey } from "@/lib/i18n";
import { getMarket } from "@/lib/market-server";
import { getShop, publishedProducts } from "@/lib/shop";

const TILES: { href: string; label: MessageKey; slug: string }[] = [
  { href: "/collection/women", label: "navWomen", slug: "clack-box-tee" },
  { href: "/collection/men", label: "navMen", slug: "clack-oxford-shirt" },
];

export default async function CategoryTiles() {
  const [live, market] = await Promise.all([getShop().then(publishedProducts), getMarket()]);
  return (
    <section id="entry" className="section tiles">
      <div className="tiles-grid">
        {TILES.map((tile) => {
          const p = live.find((item) => item.slug === tile.slug);
          if (!p) return null;
          return (
            <Link key={tile.href} href={tile.href} className="tile">
              <div className="tile-media">
                <ProductImage product={p} view="front" />
              </div>
              <div className="tile-label">
                <span className="serif">{t(market.lang, tile.label)}</span>
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
