import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderReceipt } from "@/components/OrderReceipt";
import { officialLineHref } from "@/lib/line-link";
import { getStore } from "@/lib/store";
import { getLineIdentity } from "@/lib/line";
import { safeEqual } from "@/lib/auth";
import { payConfig } from "@/lib/newebpay";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "訂單明細" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ t?: string; pay?: string; payerr?: string }>;
}) {
  const { code } = await params;
  const { t, pay, payerr } = await searchParams;
  const { orders, customers, settings } = await getStore();
  const order = orders.find((o) => o.code === code);
  if (!order) notFound();

  const identity = await getLineIdentity();
  const customer = customers.find((c) => c.id === order.customerId);
  const owner = Boolean(identity && customer && customer.lineUserId === identity.userId);
  if (!owner && !(t && safeEqual(t, order.token))) notFound();

  const canPay =
    order.paymentMethod === "online" &&
    order.paymentStatus !== "paid" &&
    order.status === "pending" &&
    payConfig(settings).ready;
  const deadline =
    order.status === "pending" && order.paymentStatus !== "paid" && order.paymentMethod !== "cod" && settings.unpaidCancelDays > 0
      ? formatDate(new Date(new Date(order.createdAt).getTime() + settings.unpaidCancelDays * 86400000).toISOString())
      : "";
  const paid = order.paymentMethod === "online" && order.paymentStatus === "paid";
  const token = t && safeEqual(t, order.token) ? t : order.token;

  return (
    <>
      <Header />
      <main className="page narrow">
        <div className="title-block">
          <span className="eyebrow">Thank you</span>
          <h1>
            {paid ? "付款完成" : "訂單已送出"}
            <span className="zh">{paid ? "Payment received" : "Order received"}</span>
          </h1>
        </div>
        {pay === "ok" && paid && (
          <div className="notice" style={{ marginBottom: 20 }}>
            已收到您的付款，謝謝。我們會透過 LINE 通知後續進度。
          </div>
        )}
        {pay === "ok" && !paid && (
          <div className="notice" style={{ marginBottom: 20 }}>
            付款結果確認中，請稍後重新整理本頁。
          </div>
        )}
        {(pay === "failed" || payerr) && (
          <div className="notice error" style={{ marginBottom: 20 }} role="alert">
            {payerr ? payerr.slice(0, 80) : "付款未完成，您可以重新嘗試付款。"}
          </div>
        )}
        <OrderReceipt order={order} />
        {canPay && (
          <div className="notice" style={{ marginBottom: 20 }}>
            此訂單尚未付款{deadline ? `，請於 ${deadline} 前完成，逾時將自動取消` : ""}。{" "}
            <a href={`/api/payment/newebpay/start?code=${order.code}&t=${token}`} className="btn solid" style={{ marginLeft: 8 }}>
              前往付款
            </a>
          </div>
        )}
        {!canPay && deadline && order.paymentMethod === "offline" && (
          <div className="notice" style={{ marginBottom: 20 }}>
            請於 {deadline} 前完成付款，逾時訂單將自動取消。
          </div>
        )}
        {order.paymentMethod === "offline" && settings.paymentNote && (
          <div className="notice" style={{ marginBottom: 20 }}>{settings.paymentNote}</div>
        )}
        {officialLineHref(settings) && (
          <div className="notice" style={{ marginBottom: 20 }}>
            請加入{settings.lineOaName ? `「${settings.lineOaName}」` : "我們的 LINE 官方帳號"}，以便收到訂單通知。{" "}
            <a href={officialLineHref(settings)} target="_blank" rel="noreferrer" className="link">
              加入好友
            </a>
          </div>
        )}
        <div style={{ padding: "16px 0 100px" }}>
          <Link href="/" className="btn">
            繼續逛逛
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
