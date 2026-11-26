import Link from "next/link";
import { deleteProduct, setProductStatus } from "@/app/actions/catalog";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { productGenders, totalStock } from "@/lib/catalog";
import { formatUsd } from "@/lib/money";
import { getShop } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ saved?: string; filter?: string }> }) {
  const { saved, filter } = await searchParams;
  const { products } = await getShop();
  const list = products.filter((product) => {
    const status = product.status ?? "published";
    if (filter === "published") return status === "published";
    if (filter === "draft") return status === "draft";
    return true;
  });
  return (
    <>
      <header className="staff-head">
        <h1 className="serif">商品</h1>
        <Link href="/admin/products/new" className="btn btn-solid">上架新商品</Link>
      </header>
      {saved && <p className="fine">商品已儲存。前台目錄已更新。</p>}
      <p className="admin-filters">
        <Link href="/admin/products" data-active={!filter}>全部 {products.length}</Link>
        <Link href="/admin/products?filter=published" data-active={filter === "published"}>上架</Link>
        <Link href="/admin/products?filter=draft" data-active={filter === "draft"}>草稿</Link>
      </p>
      <div className="staff-table-wrap">
        <table className="staff-table">
          <thead><tr><th>商品</th><th>分類</th><th>售價</th><th>庫存</th><th>狀態</th><th></th></tr></thead>
          <tbody>
            {list.map((product) => {
              const stock = totalStock(product);
              const status = product.status ?? "published";
              return (
                <tr key={product.slug}>
                  <td><Link href={`/admin/products/${product.slug}`}>{product.name}</Link><small>{product.slug}</small></td>
                  <td>{productGenders(product).length > 1 ? "女裝與男裝" : product.gender === "men" ? "男裝" : "女裝"}</td>
                  <td>{formatUsd(product.price)}</td>
                  <td>{stock === null ? "不追蹤" : stock}</td>
                  <td>{status === "published" ? "上架" : "草稿"}</td>
                  <td>
                    <div className="staff-actions">
                      <form action={setProductStatus}>
                        <input type="hidden" name="slug" value={product.slug} />
                        <input type="hidden" name="status" value={status === "published" ? "draft" : "published"} />
                        <button className="btn btn-outline">{status === "published" ? "下架" : "上架"}</button>
                      </form>
                      <Link href={`/admin/products/${product.slug}`} className="btn btn-outline">編輯</Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="slug" value={product.slug} />
                        <ConfirmSubmit className="btn btn-outline" label="刪除" message={`刪除 ${product.name}？`} />
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
