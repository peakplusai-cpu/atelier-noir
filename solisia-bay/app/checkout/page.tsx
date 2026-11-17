import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import { paypalClientId } from "@/lib/paypal-public";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <section className="page">
      <header className="collection-head">
        <p className="eyebrow">Secure checkout</p>
        <h1 className="serif">Checkout</h1>
      </header>
      <CheckoutForm paypalClientId={paypalClientId()} />
    </section>
  );
}
