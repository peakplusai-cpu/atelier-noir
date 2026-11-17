import Link from "next/link";
import { listOrders, StorageError, type Order } from "@/lib/orders";
import { STATUS_LABEL } from "@/lib/staff-labels";
import { formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

function when(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function DeskPage() {
  let orders: Order[] = [];
  let error = "";
  try {
    orders = await listOrders();
  } catch (err) {
    error = err instanceof StorageError ? err.message : "訂單讀取失敗";
  }
  const open = orders.filter((o) => o.status === "paid" || o.status === "shipped").length;

  return (
    <>
      <header className="staff-head">
        <h1 className="serif">訂單</h1>
        <p>{orders.length} 筆，{open} 筆待出貨或運送中</p>
      </header>
      {error && <p className="form-error">{error}</p>}
      {orders.length === 0 ? (
        <p className="fine">還沒有訂單。</p>
      ) : (
        <div className="staff-table-wrap">
        <table className="staff-table">
          <thead>
            <tr>
              <th>訂單</th>
              <th>時間（台北）</th>
              <th>顧客</th>
              <th>狀態</th>
              <th>金額</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.code}>
                <td>
                  <Link href={`/admin/orders/${o.code}`}>{o.code}</Link>
                </td>
                <td>{when(o.createdAt)}</td>
                <td>
                  {o.name}
                  <small>{o.email}</small>
                </td>
                <td>
                  <span className={`staff-status status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                </td>
                <td>{formatUsd(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </>
  );
}
