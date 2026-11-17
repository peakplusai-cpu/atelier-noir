import { PromoForm } from "@/components/admin/PromoForm";
import { getShop } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function NewPromotionPage() {
  const { products } = await getShop();
  return (
    <>
      <header className="staff-head"><h1 className="serif">新增優惠</h1></header>
      <PromoForm products={products} />
    </>
  );
}
