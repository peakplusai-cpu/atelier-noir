import type { Metadata } from "next";
import Link from "next/link";
import PaymentStatus from "@/components/PaymentStatus";
import { formatUsd } from "@/lib/money";
import { getOrder } from "@/lib/orders";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const code = typeof sp.order === "string" ? sp.order : "";
  const token = typeof sp.token === "string" ? sp.token : "";
  const order = code ? await getOrder(code).catch(() => null) : null;

  if (!order || order.token !== token) {
    return (
      <section className="page narrow center">
        <p className="eyebrow">Order</p>
        <h1 className="serif">We couldn&rsquo;t find that order</h1>
        <p>If you just paid, a confirmation email is on its way. Questions? Email us any time.</p>
        <Link href="/collection/all" className="btn btn-solid">
          Continue shopping
        </Link>
      </section>
    );
  }

  const failed = order.status === "failed" || order.status === "cancelled";
  const paid = order.status === "paid";

  return (
    <section className="page narrow">
      <PaymentStatus code={order.code} token={order.token} status={order.status} />
      <div className="center">
        <p className="eyebrow">{paid ? "Thank you" : failed ? "Payment not completed" : "Almost there"}</p>
        <h1 className="serif">
          {paid ? "Your order is confirmed" : failed ? "We couldn\u2019t complete your order" : "Confirming your payment\u2026"}
        </h1>
        <p>
          {paid
            ? `A receipt is on its way to ${order.email}. We'll email tracking details as soon as your order ships.`
            : failed
              ? "Your card was not charged. Please return to your bag and try again."
              : "This usually takes a few seconds. This page will update automatically."}
        </p>
      </div>

      <div className="receipt">
        <div className="receipt-head">
          <span>Order</span>
          <strong>{order.code}</strong>
        </div>
        <ul>
          {order.items.map((i, idx) => (
            <li key={idx}>
              <span>
                {i.name} <small>{i.color} · {i.size} × {i.qty}</small>
              </span>
              <span>{formatUsd(i.unitPrice * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatUsd(order.subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{order.shipping === 0 ? "Free" : formatUsd(order.shipping)}</dd>
          </div>
          <div className="totals-grand">
            <dt>Total</dt>
            <dd>{formatUsd(order.total)}</dd>
          </div>
        </dl>
        <p className="fine">
          Shipping to {order.name}, {order.address.line1}
          {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city} {order.address.postalCode},{" "}
          {order.address.country}
        </p>
      </div>

      <div className="center">
        <Link href={failed ? "/checkout" : "/collection/all"} className="btn btn-outline">
          {failed ? "Return to checkout" : "Continue shopping"}
        </Link>
      </div>
    </section>
  );
}
