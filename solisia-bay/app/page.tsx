import CategoryTiles from "@/components/CategoryTiles";
import BestsellerCarousel from "@/components/BestsellerCarousel";
import { PhotoWall } from "@/components/PhotoWall";
import { bestsellers } from "@/lib/catalog";
import { getShop, publishedProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const shop = await getShop();
  const products = publishedProducts(shop);
  return (
    <>
      <PhotoWall posts={shop.wall} products={products} />
      <CategoryTiles />
      <section className="section">
        <BestsellerCarousel items={bestsellers(8, products)} />
      </section>
    </>
  );
}
