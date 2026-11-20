import Link from "next/link";
import { Ticker } from "./Ticker";
import { Wordmark } from "./Wordmark";
import { SITE } from "@/lib/site";

export default function Hero() {
  return (
    <section className="hero hero-zine" aria-label="CLACK select shop">
      <div className="zine-poster">
        <p className="zine-kicker">SELECT SHOP · 選品店</p>
        <Wordmark className="wordmark wordmark-hero" />
        <p className="zine-en">{SITE.tagline}</p>
        <p className="zine-zh">{SITE.taglineZh}</p>
        <div className="zine-stickers" aria-hidden="true">
          <span>BREAK</span>
          <span>SKATE</span>
          <span>NO MALL</span>
        </div>
        <div className="hero-cta">
          <Link href="/collection/women" className="btn btn-light">
            女裝 Women
          </Link>
          <Link href="/collection/men" className="btn btn-light">
            男裝 Men
          </Link>
          <Link href="/collection/all" className="btn btn-ghost-light">
            全部 Shop All
          </Link>
        </div>
      </div>
      <Ticker />
    </section>
  );
}
