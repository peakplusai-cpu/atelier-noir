import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import ProductCard from "@/components/ProductCard";
import { ALL_SIZES, COLLECTIONS, productBrand, productSizes, productTags, productsFor } from "@/lib/catalog";
import { styleText, t } from "@/lib/i18n";
import { getMarket } from "@/lib/market-server";
import { getShop, publishedProducts } from "@/lib/shop";
import type { Product, StyleKey } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return Object.keys(COLLECTIONS).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const c = COLLECTIONS[handle];
  if (!c) return {};
  const market = await getMarket();
  const title = handle === "women" ? t(market.lang, "navWomen") : handle === "men" ? t(market.lang, "navMen") : t(market.lang, "navAll");
  return { title, description: "CLACK" };
}

function list(v: string | string[] | undefined): string[] {
  const s = Array.isArray(v) ? v.join(",") : (v ?? "");
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function sortProducts(items: Product[], sort: string): Product[] {
  const copy = [...items];
  if (sort === "price-asc") return copy.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return copy.sort((a, b) => b.price - a.price);
  if (sort === "newest") return copy.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
  return copy.sort((a, b) => Number(!!b.bestseller) - Number(!!a.bestseller));
}

const TABS = [
  { handle: "all", label: "navAll" },
  { handle: "women", label: "navWomen" },
  { handle: "men", label: "navMen" },
] as const;

export default async function CollectionPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const collection = COLLECTIONS[handle];
  if (!collection) notFound();
  const market = await getMarket();
  const title = handle === "women" ? t(market.lang, "navWomen") : handle === "men" ? t(market.lang, "navMen") : t(market.lang, "navAll");

  const sp = await searchParams;
  const sizes = list(sp.size);
  const styles = list(sp.style);
  const brands = list(sp.brand);
  const tags = list(sp.tag);
  const sort = typeof sp.sort === "string" ? sp.sort : "featured";

  const base = productsFor(handle, publishedProducts(await getShop()));
  const filtered = base.filter(
    (p) =>
      (styles.length === 0 || styles.includes(p.style)) &&
      (sizes.length === 0 || productSizes(p).some((s) => sizes.includes(s))) &&
      (brands.length === 0 || brands.includes(productBrand(p))) &&
      (tags.length === 0 || productTags(p).some((tag) => tags.includes(tag)))
  );
  const items = sortProducts(filtered, sort);

  const styleKeys = Array.from(new Set(base.map((p) => p.style))) as StyleKey[];
  const sizeOptions = ALL_SIZES.filter((s) => base.some((p) => productSizes(p).includes(s)));

  return (
    <section className="page">
      <header className="collection-head">
        <h1 className="serif">{title}</h1>
        <nav className="tabs" aria-label={t(market.lang, "collections")}>
          {TABS.map((tab) => (
            <Link key={tab.handle} href={`/collection/${tab.handle}`} data-active={tab.handle === handle}>
              {t(market.lang, tab.label)}
            </Link>
          ))}
        </nav>
      </header>

      {base.length > 0 && (
        <Suspense fallback={null}>
          <FilterBar
            sizes={sizeOptions}
            styles={styleKeys.map((k) => ({ value: k, label: styleText(k, market.lang) }))}
            brands={Array.from(new Set(base.map(productBrand).filter(Boolean))).sort()}
            tags={Array.from(new Set(base.flatMap(productTags))).sort()}
            total={base.length}
            shown={items.length}
          />
        </Suspense>
      )}

      {base.length === 0 ? (
        <div className="empty">
          <p className="serif">{t(market.lang, "emptyCatalog")}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <p className="serif">{t(market.lang, "emptyFilter")}</p>
          <Link href={`/collection/${handle}`} className="btn btn-outline">
            {t(market.lang, "clearFilters")}
          </Link>
        </div>
      ) : (
        <div className="grid">
          {items.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </section>
  );
}
