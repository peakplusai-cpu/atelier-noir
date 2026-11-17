import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getShop } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = (await getShop()).products.find((item) => item.slug === slug);
  if (!product) notFound();
  return (
    <>
      <header className="staff-head"><h1 className="serif">編輯商品</h1></header>
      <ProductForm product={product} />
    </>
  );
}
