import Link from "next/link";
import { notFound } from "next/navigation";
import { setOrderStatus } from "@/app/actions/staff";
import { getOrder } from "@/lib/orders";
import { STATUS_ACTIONS, STATUS_LABEL } from "@/lib/staff-labels";
import { formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

export default async function OrderPage({ params }: Props) {
  const { code } = await params;
  const order = await getOrder(code);
  if (!order) notFound();
  const actions = STATUS_ACTIONS[order.status] ?? [];
  const address = [order.address.line1, order.address.line2, order.address.city, order.address.state, order.address.postalCode, order.address.country]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <p className="staff-back">
        <Link href="/admin">← 全部訂單</Link>
      </p>
      <header className="staff-head">
        <h1 className="serif">{order.code}</h1>
        <p>
          <span className={`staff-status status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
          {" · "}
          {formatUsd(order.total)}
        </p>
      </header>

      <div className="staff-grid">
        <div>
          <h2>品項</h2>
          <ul className="staff-items">
            {order.items.map((item, i) => (
              <li key={i}>
                <span>
                  {item.name}
                  <small>
                    {item.color} · {item.size} × {item.qty}
                  </small>
                </span>
                <span>{formatUsd(item.unitPrice * item.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="fine">
            小計 {formatUsd(order.subtotal)} · 運費 {order.shipping === 0 ? "免運" : formatUsd(order.shipping)}
          </p>
        </div>
        <div>
          <h2>收件</h2>
          <p>
            {order.name}
            <br />
            {order.email}
            {order.phone && (
              <>
                <br />
                {order.phone}
              </>
            )}
            <br />
            {address}
          </p>
          {order.paymentCaptureId && <p className="fine">PayPal capture {order.paymentCaptureId}</p>}
          {order.status === "paid" && <p className="fine">標記取消不會自動退款，退款請到 PayPal 後台處理。</p>}
          {actions.length > 0 && (
            <div className="staff-actions">
              {actions.map((action) => (
                <form key={action.status} action={setOrderStatus}>
                  <input type="hidden" name="code" value={order.code} />
                  <input type="hidden" name="status" value={action.status} />
                  <button type="submit" className={action.status === "cancelled" ? "btn btn-outline" : "btn btn-solid"}>
                    {action.label}
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
