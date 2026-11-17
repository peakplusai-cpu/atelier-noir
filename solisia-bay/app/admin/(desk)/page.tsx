import Link from "next/link";
import { listOrders, StorageError, type Order } from "@/lib/orders";
import { totalStock } from "@/lib/catalog";
import { formatUsd } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/staff-labels";
import { getShop } from "@/lib/shop";

export const dynamic = "force-dynamic";

function when(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export default async function DashboardPage() {
  let orders: Order[] = [];
  let error = "";
  try {
    orders = await listOrders();
  } catch (err) {
    error = err instanceof StorageError ? err.message : "訂單讀取失敗";
  }
  const shop = await getShop();
  const published = shop.products.filter((product) => (product.status ?? "published") === "published");
  const open = orders.filter((order) => order.status === "paid" || order.status === "shipped");
  const revenue = orders.filter((order) => order.status === "paid" || order.status === "shipped" || order.status === "completed").reduce((sum, order) => sum + order.total, 0);
  const customers = new Set(orders.map((order) => order.email.toLowerCase())).size;
  const low = published.filter((product) => {
    const stock = totalStock(product);
    return stock !== null && stock <= 5;
  });
  const recent = orders.slice(0, 8);

  return (
    <>
      <header className="staff-head">
        <h1 className="serif">總覽</h1>
        <Link href="/admin/products/new" className="btn btn-solid">新增商品</Link>
      </header>
      {error && <p className="form-error">{error}</p>}
      <div className="stat-grid">
        <article><span>待處理訂單</span><strong>{open.length}</strong></article>
        <article><span>上架中商品</span><strong>{published.length}<small> / {shop.products.length}</small></strong></article>
        <article><span>客戶數</span><strong>{customers}</strong></article>
        <article><span>累計營收</span><strong>{formatUsd(revenue)}</strong></article>
      </div>
      {low.length > 0 && (
        <p className="form-error">庫存偏低（5 件以下）：{low.map((product) => `${product.name}（${totalStock(product)}）`).join("、")}</p>
      )}
      <header className="staff-head">
        <h2 className="serif">最新訂單</h2>
        <Link href="/admin/orders">全部訂單</Link>
      </header>
      {recent.length === 0 ? <p className="fine">還沒有訂單。</p> : (
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead><tr><th>訂單</th><th>顧客</th><th>時間（台北）</th><th>狀態</th><th>金額</th></tr></thead>
            <tbody>
              {recent.map((order) => (
                <tr key={order.code}>
                  <td><Link href={`/admin/orders/${order.code}`}>{order.code}</Link></td>
                  <td>{order.name}<small>{order.email}</small></td>
                  <td>{when(order.createdAt)}</td>
                  <td><span className={`staff-status status-${order.status}`}>{STATUS_LABEL[order.status]}</span></td>
                  <td>{formatUsd(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
