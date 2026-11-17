import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <p className="logo logo-footer">
            SOLISIA <span>BAY</span>
          </p>
          <p>{SITE.tagline}</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link href="/collection/women">Women</Link>
          <Link href="/collection/men">Men</Link>
          <Link href="/collection/couples">Couples Sets</Link>
          <Link href="/collection/all">Shop All</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link href="/policies/shipping-returns">Shipping &amp; Returns</Link>
          <Link href="/policies/swimwear-hygiene">Swimwear Hygiene Liner</Link>
          <Link href="/policies/size-guide">Size Guide</Link>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </div>
        <div>
          <h4>Secure checkout</h4>
          <p className="footer-note">Payments are processed securely by Creem. We never see or store your card details.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} SOLISIA BAY. All rights reserved.</p>
        <p>All prices in USD.</p>
      </div>
    </footer>
  );
}
