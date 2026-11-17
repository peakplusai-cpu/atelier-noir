import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <>
      <header className="staff-head"><h1 className="serif">上架商品</h1></header>
      <ProductForm />
    </>
  );
}
