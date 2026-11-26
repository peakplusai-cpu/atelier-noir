import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import { t } from "@/lib/i18n";
import { newebpayConfigured } from "@/lib/newebpay";

export const metadata: Metadata = { title: "結帳", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <section className="page">
      <header className="collection-head">
        <p className="eyebrow">{t("zh", "secureCheckout")}</p>
        <h1 className="serif">{t("zh", "checkout")}</h1>
      </header>
      {newebpayConfigured() ? null : <p className="form-error" role="status">付款功能尚未開通</p>}
      <CheckoutForm paymentsReady={newebpayConfigured()} />
    </section>
  );
}
