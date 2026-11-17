import Link from "next/link";
import Hero from "@/components/Hero";
import CategoryTiles from "@/components/CategoryTiles";
import BestsellerCarousel from "@/components/BestsellerCarousel";
import BrandStory from "@/components/BrandStory";
import { bestsellers } from "@/lib/catalog";
import { getShop, publishedProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const shop = await getShop();
  const items = bestsellers(8, publishedProducts(shop));
  const wall = shop.wall.filter((post) => post.published && post.image);
  return (
    <>
      <Hero />
      <CategoryTiles />
      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Best sellers</p>
            <h2 className="serif">The pieces everyone is packing</h2>
          </div>
          <Link href="/collection/all" className="text-link">
            Shop all
          </Link>
        </div>
        <BestsellerCarousel items={items} />
      </section>
      {wall.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">The bay</p>
              <h2 className="serif">From the water</h2>
            </div>
          </div>
          <div className="wall-grid">
            {wall.map((post) => {
              const inner = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.image} alt={post.caption || "SOLISIA BAY"} />
                  {post.caption && <span>{post.caption}</span>}
                </>
              );
              return post.slug ? (
                <Link key={post.id || post.image} href={`/products/${post.slug}`} className="wall-card">{inner}</Link>
              ) : (
                <figure key={post.id || post.image} className="wall-card">{inner}</figure>
              );
            })}
          </div>
        </section>
      )}
      <BrandStory />
    </>
  );
}
