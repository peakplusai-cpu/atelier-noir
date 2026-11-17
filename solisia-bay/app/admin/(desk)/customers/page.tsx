import Link from "next/link";
import { listOrders, StorageError } from "@/lib/orders";
import { formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const needle = q.trim().toLowerCase();
  let error = "";
  let orders = [] as Awaited<ReturnType<typeof listOrders>>;
  try {
    orders = await listOrders(500);
  } catch (err) {
    error = err instanceof StorageError ? err.message : "訂單讀取失敗";
  }
  const grouped = new Map<string, typeof orders>();
  for (const order of orders) {
    const key = order.email.toLowerCase();
    grouped.set(key, [...(grouped.get(key) ?? []), order]);
  }
  const rows = [...grouped.entries()]
    .map(([email, mine]) => ({
      email,
      name: mine[0]?.name ?? email,
      count: mine.length,
      open: mine.filter((order) => order.status === "paid" || order.status === "shipped").length,
      spent: mine.filter((order) => order.status === "paid" || order.status === "shipped" || order.status === "completed").reduce((sum, order) => sum + order.total, 0),
      last: mine[0]?.createdAt ?? "",
    }))
    .filter((row) => !needle || `${row.name} ${row.email}`.toLowerCase().includes(needle))
    .sort((a, b) => (a.last < b.last ? 1 : -1));

  return (
    <>
      <header className="staff-head">
        <div>
          <h1 className="serif">客戶</h1>
          <p>依結帳 email 合併。這間店沒有會員登入。</p>
        </div>
        <form className="admin-search" action="/admin/customers">
          <input name="q" defaultValue={q} placeholder="姓名或 email" aria-label="搜尋客戶" />
          <button className="btn btn-outline">搜尋</button>
        </form>
      </header>
      {error && <p className="form-error">{error}</p>}
      {rows.length === 0 ? <p className="fine">還沒有客戶。</p> : (
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead><tr><th>顧客</th><th>訂單</th><th>待處理</th><th>消費</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.email}>
                  <td><Link href={`/admin/customers/${encodeURIComponent(row.email)}`}>{row.name}</Link><small>{row.email}</small></td>
                  <td>{row.count}</td>
                  <td>{row.open}</td>
                  <td>{formatUsd(row.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
