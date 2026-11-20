import Hero from "@/components/Hero";
import CategoryTiles from "@/components/CategoryTiles";
import BestsellerCarousel from "@/components/BestsellerCarousel";
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
        <BestsellerCarousel items={items} />
      </section>
    </>
  );
}
