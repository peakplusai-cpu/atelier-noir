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
            <p className="eyebrow">Session picks</p>
            <h2 className="serif">這季會穿上場的</h2>
          </div>
          <Link href="/collection/all" className="text-link">
            全部 Shop all
          </Link>
        </div>
        <BestsellerCarousel items={items} />
      </section>
      <BrandStory />
    </>
  );
}
