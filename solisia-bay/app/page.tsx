import ProductCard from "@/components/ProductCard";
import { PhotoWall } from "@/components/PhotoWall";
import { newestFirst } from "@/lib/catalog";
import { getShop, publishedProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const shop = await getShop();
  const products = newestFirst(publishedProducts(shop));
  return (
    <>
      <PhotoWall posts={shop.wall} products={products} />
      <section className="section home-products">
        <div className="grid">
          {products.map((product, index) => (
            <ProductCard key={product.slug} product={product} priority={index < 4} />
          ))}
        </div>
      </section>
    </>
  );
}
