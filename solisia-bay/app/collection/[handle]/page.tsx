import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import ProductCard from "@/components/ProductCard";
import { ALL_SIZES, COLLECTIONS, STYLE_LABELS, productBrand, productSizes, productTags, productsFor } from "@/lib/catalog";
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
  return c ? { title: c.title, description: c.blurb } : {};
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
  { handle: "all", label: "全部 All" },
  { handle: "women", label: "女裝 Women" },
  { handle: "men", label: "男裝 Men" },
  { handle: "couples", label: "雙人 Couples Sets" },
];

export default async function CollectionPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const collection = COLLECTIONS[handle];
  if (!collection) notFound();

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
        <p className="eyebrow">{collection.eyebrow}</p>
        <h1 className="serif">{collection.title}</h1>
        <p className="lede">{collection.blurb}</p>
        <nav className="tabs" aria-label="Collections">
          {TABS.map((t) => (
            <Link key={t.handle} href={`/collection/${t.handle}`} data-active={t.handle === handle}>
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      {base.length > 0 && (
        <Suspense fallback={null}>
          <FilterBar
            sizes={sizeOptions}
            styles={styleKeys.map((k) => ({ value: k, label: STYLE_LABELS[k] }))}
            brands={Array.from(new Set(base.map(productBrand).filter(Boolean))).sort()}
            tags={Array.from(new Set(base.flatMap(productTags))).sort()}
            total={base.length}
            shown={items.length}
          />
        </Suspense>
      )}

      {base.length === 0 ? (
        <div className="empty">
          <p className="eyebrow">Coming soon</p>
          <p className="serif">選品還在路上。</p>
          <p>這一區現在是空的。New pieces are on the way.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <p className="serif">沒有符合的選品。Nothing matches those filters.</p>
          <Link href={`/collection/${handle}`} className="btn btn-outline">
            Clear filters
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
