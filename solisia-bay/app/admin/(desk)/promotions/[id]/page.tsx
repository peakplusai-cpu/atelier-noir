import { notFound } from "next/navigation";
import { PromoForm } from "@/components/admin/PromoForm";
import { getShop } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await getShop();
  const promo = shop.promotions.find((item) => item.id === id);
  if (!promo) notFound();
  return (
    <>
      <header className="staff-head"><h1 className="serif">編輯優惠</h1></header>
      <PromoForm promo={promo} products={shop.products} />
    </>
  );
}
