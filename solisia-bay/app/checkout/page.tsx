import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="page">
      <header className="collection-head">
        <p className="eyebrow">Secure checkout</p>
        <h1 className="serif">Checkout</h1>
      </header>
      <CheckoutForm />
    </section>
  );
}
