import type { Metadata } from "next";
import Link from "next/link";
import PaymentStatus from "@/components/PaymentStatus";
import { formatUsd } from "@/lib/money";
import { getOrder } from "@/lib/orders";
import { safeEqualString } from "@/lib/secret";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const code = typeof sp.order === "string" ? sp.order : "";
  const token = typeof sp.token === "string" ? sp.token : "";
  const order = code ? await getOrder(code).catch(() => null) : null;

  if (!order || !safeEqualString(order.token, token)) {
    return (
      <section className="page narrow center">
        <p className="eyebrow">Order</p>
        <h1 className="serif">We couldn&rsquo;t find that order</h1>
        <p>If you just paid, refresh this page in a moment. For help, email {SITE.email} with your order number.</p>
        <Link href="/collection/all" className="btn btn-solid">
          Continue shopping
        </Link>
      </section>
    );
  }

  const confirmed = order.status === "paid" || order.status === "shipped" || order.status === "completed";
  const review = order.status === "review";
  const cancelledAfterPay = order.status === "cancelled" && Boolean(order.paymentCaptureId || order.paidAt);
  const failed = order.status === "failed" || (order.status === "cancelled" && !cancelledAfterPay);

  return (
    <section className="page narrow">
      <PaymentStatus code={order.code} token={order.token} status={order.status} />
      <div className="center">
        <p className="eyebrow">{confirmed ? "Thank you" : failed ? "Payment not completed" : review ? "Payment received" : "Almost there"}</p>
        <h1 className="serif">
          {confirmed
            ? "Your order is confirmed"
            : cancelledAfterPay
              ? "This order was cancelled"
              : review
                ? "We\u2019re checking this payment"
                : failed
                  ? "We couldn\u2019t complete your order"
                  : "Confirming your payment\u2026"}
        </h1>
        <p>
          {confirmed
            ? `Keep this page as your receipt for ${order.email}. We'll email tracking details to that address when the order ships.`
            : cancelledAfterPay
              ? `This order was cancelled after payment. If you still see a PayPal charge, email ${SITE.email} and include ${order.code}.`
              : review
                ? `PayPal accepted a payment that doesn't match this order. Email ${SITE.email} with ${order.code} before placing it again.`
                : failed
                  ? "You can return to your bag and try again. If PayPal shows a charge, email us before you pay a second time."
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
