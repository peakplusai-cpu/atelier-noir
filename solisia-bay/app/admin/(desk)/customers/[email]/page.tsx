import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { formatUsd } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/staff-labels";

export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }: { params: Promise<{ email: string }> }) {
  const email = decodeURIComponent((await params).email).toLowerCase();
  const orders = (await listOrders(500)).filter((order) => order.email.toLowerCase() === email);
  return (
    <>
      <p className="staff-back"><Link href="/admin/customers">← 全部客戶</Link></p>
      <header className="staff-head">
        <div>
          <h1 className="serif">{orders[0]?.name ?? email}</h1>
          <p>{email}</p>
        </div>
      </header>
      {orders.length === 0 ? <p className="fine">沒有這個 email 的訂單。</p> : (
        <ul className="staff-items">
          {orders.map((order) => (
            <li key={order.code}>
              <span><Link href={`/admin/orders/${order.code}`}>{order.code}</Link><small>{STATUS_LABEL[order.status]}</small></span>
              <span>{formatUsd(order.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
