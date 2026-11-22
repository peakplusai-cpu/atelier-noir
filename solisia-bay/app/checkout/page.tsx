import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import { t } from "@/lib/i18n";
import { getMarket } from "@/lib/market-server";
import { paypalClientId } from "@/lib/paypal-public";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const { lang } = await getMarket();
  return (
    <section className="page">
      <header className="collection-head">
        <p className="eyebrow">{t(lang, "secureCheckout")}</p>
        <h1 className="serif">{t(lang, "checkout")}</h1>
      </header>
      <CheckoutForm paypalClientId={paypalClientId()} />
    </section>
  );
}
