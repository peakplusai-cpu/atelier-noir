import type { Metadata } from "next";
import Link from "next/link";
import PaymentStatus from "@/components/PaymentStatus";
import { t } from "@/lib/i18n";
import { getMarket } from "@/lib/market-server";
import { formatMoney } from "@/lib/money";
import { getOrder } from "@/lib/orders";
import { safeEqualString } from "@/lib/secret";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "CLACK", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const code = typeof sp.order === "string" ? sp.order : "";
  const token = typeof sp.token === "string" ? sp.token : "";
  const order = code ? await getOrder(code).catch(() => null) : null;
  const { lang } = await getMarket();
  const money = (amount: number, currency: string) => formatMoney(amount, currency, lang);

  if (!order || !safeEqualString(order.token, token)) {
    return (
      <section className="page narrow center">
        <p className="eyebrow">{t(lang, "order")}</p>
        <h1 className="serif">{t(lang, "missingOrder")}</h1>
        <p>{t(lang, "missingOrderBody", { email: SITE.email })}</p>
        <Link href="/collection/all" className="btn btn-solid">
          {t(lang, "continueShopping")}
        </Link>
      </section>
    );
  }

  const confirmed = order.status === "paid" || order.status === "shipped" || order.status === "completed";
  const review = order.status === "review";
  const cancelledAfterPay = order.status === "cancelled" && Boolean(order.paymentCaptureId || order.paidAt);
  const failed = order.status === "failed" || (order.status === "cancelled" && !cancelledAfterPay);
  const currency = order.currency || "TWD";

  return (
    <section className="page narrow">
      <PaymentStatus code={order.code} token={order.token} status={order.status} />
      <div className="center">
        <p className="eyebrow">{confirmed ? t(lang, "thanks") : failed ? t(lang, "notPaid") : review ? t(lang, "paymentReceived") : t(lang, "almost")}</p>
        <h1 className="serif">
          {confirmed
            ? t(lang, "confirmed")
            : cancelledAfterPay
              ? t(lang, "cancelled")
              : review
                ? t(lang, "checking")
                : failed
                  ? t(lang, "couldNot")
                  : t(lang, "confirming")}
        </h1>
        <p>
          {confirmed
            ? t(lang, "receipt", { email: order.email })
            : cancelledAfterPay
              ? t(lang, "cancelledBody", { email: SITE.email, code: order.code })
              : review
                ? t(lang, "reviewBody", { email: SITE.email, code: order.code })
                : failed
                  ? t(lang, "failedBody")
                  : t(lang, "pendingBody")}
        </p>
      </div>

      <div className="receipt">
        <div className="receipt-head">
          <span>{t(lang, "clackOrder")}</span>
          <strong>{order.code}</strong>
        </div>
        <ul>
          {order.items.map((item, idx) => (
            <li key={idx}>
              <span>
                {item.name} <small>{item.color} · {item.size} × {item.qty}</small>
              </span>
              <span>{money(item.unitPrice * item.qty, currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="totals">
          <div>
            <dt>{t(lang, "subtotal")}</dt>
            <dd>{money(order.subtotal, currency)}</dd>
          </div>
          <div>
            <dt>{t(lang, "shipping")}</dt>
            <dd>{order.shipping === 0 ? t(lang, "free") : money(order.shipping, currency)}</dd>
          </div>
          <div className="totals-grand">
            <dt>{t(lang, "total")}</dt>
            <dd>{money(order.total, currency)}</dd>
          </div>
        </dl>
        {order.displayCurrency && order.displayCurrency !== currency && (
          <p className="fine">{t(lang, "paypalCharges", { amount: money(order.total, currency) })}</p>
        )}
        {currency !== "TWD" && order.baseTotal > 0 && <p className="fine">{t(lang, "baseTwd", { amount: money(order.baseTotal, "TWD") })}</p>}
        <p className="fine">
          {t(lang, "shippingTo")} {order.name}, {order.address.line1}
          {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city} {order.address.postalCode}, {order.address.country}
        </p>
      </div>

      <div className="center">
        <Link href={failed ? "/checkout" : "/collection/all"} className="btn btn-outline">
          {failed ? t(lang, "checkout") : t(lang, "continueShopping")}
        </Link>
      </div>
    </section>
  );
}
