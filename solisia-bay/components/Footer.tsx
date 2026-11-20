import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <p className="logo logo-footer">
            <Wordmark />
          </p>
          <p>{SITE.tagline}</p>
          <p>{SITE.taglineZh}</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link href="/collection/women">女裝 Women</Link>
          <Link href="/collection/men">男裝 Men</Link>
          <Link href="/collection/couples">雙人 Couples Sets</Link>
          <Link href="/collection/all">全部 Shop All</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link href="/policies/shipping-returns">Shipping &amp; Returns</Link>
          <Link href="/policies/swimwear-hygiene">Swimwear Hygiene Liner</Link>
          <Link href="/policies/size-guide">Size Guide</Link>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <Link href="/admin" className="staff-entry">
            員工專用入口
          </Link>
        </div>
        <div>
          <h4>結帳 Secure checkout</h4>
          <p className="footer-note">付款由 PayPal 處理。CLACK 看不到、也不保存你的卡號。</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} CLACK. All rights reserved.</p>
        <p>價格皆為 USD。</p>
      </div>
    </footer>
  );
}
