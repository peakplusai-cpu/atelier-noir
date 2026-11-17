import Link from "next/link";
import Hero from "@/components/Hero";
import CategoryTiles from "@/components/CategoryTiles";
import BestsellerCarousel from "@/components/BestsellerCarousel";
import BrandStory from "@/components/BrandStory";
import { PhotoWall } from "@/components/PhotoWall";
import { bestsellers } from "@/lib/catalog";
import { getShop, publishedProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const shop = await getShop();
  const items = bestsellers(8, publishedProducts(shop));
  return (
    <>
      <Hero />
      <PhotoWall posts={shop.wall} products={publishedProducts(shop)} />
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
      <BrandStory />
    </>
  );
}
