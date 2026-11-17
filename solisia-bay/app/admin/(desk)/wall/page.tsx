import { WallForm } from "@/components/admin/WallForm";
import { getShop } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function WallPage() {
  const shop = await getShop();
  return (
    <>
      <header className="staff-head">
        <div>
          <h1 className="serif">動態牆</h1>
          <p>顯示在首頁。可連結到一件商品。</p>
        </div>
      </header>
      <WallForm posts={shop.wall} products={shop.products} />
    </>
  );
}
