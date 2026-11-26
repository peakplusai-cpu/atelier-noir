import Link from "next/link";
import { notFound } from "next/navigation";
import { setOrderStatus } from "@/app/actions/staff";
import { getOrder } from "@/lib/orders";
import { STATUS_ACTIONS, STATUS_LABEL } from "@/lib/staff-labels";
import { formatMoney } from "@/lib/money";

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
          {formatMoney(order.total, order.currency || "TWD", "zh")}
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
                <span>{formatMoney(item.unitPrice * item.qty, order.currency || "TWD", "zh")}</span>
              </li>
            ))}
          </ul>
          <p className="fine">
            小計 {formatMoney(order.subtotal, order.currency || "TWD", "zh")}
            {order.discount > 0 ? ` · 折扣 -${formatMoney(order.discount, order.currency || "TWD", "zh")}${order.coupon ? `（${order.coupon}）` : ""}` : ""}
            {" · "}運費 {order.shipping === 0 ? "免運" : formatMoney(order.shipping, order.currency || "TWD", "zh")}
            {order.baseTotal > 0 && order.currency !== "TWD" ? ` · 新台幣 ${formatMoney(order.baseTotal, "TWD", "zh")}` : ""}
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
          {order.paymentCaptureId && <p className="fine">金流交易編號 {order.paymentCaptureId}</p>}
          {order.payment?.codeNo && <p className="fine">繳費代碼 {order.payment.codeNo}{order.payment.bankCode ? `　銀行 ${order.payment.bankCode}` : ""}</p>}
          {order.paymentCaptureId && order.status === "pending" && (
            <p className="form-error">已有金流交易編號，但訂單仍是待付款。請勿出貨，先到藍新後台核對。</p>
          )}
          {order.status === "review" && (
            <p className="form-error">付款金額與訂單不一致。請勿出貨，到藍新後台核對並退款。</p>
          )}
          {(order.status === "paid" || order.status === "review" || (order.status === "cancelled" && order.paymentCaptureId)) && (
            <p className="fine">標記取消不會自動退款，退款請到藍新後台處理。</p>
          )}
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
