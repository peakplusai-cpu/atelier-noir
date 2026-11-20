import Link from "next/link";
import { Wordmark } from "./Wordmark";

export default function Hero() {
  return (
    <section className="hero hero-zine" aria-label="CLACK">
      <div className="zine-poster">
        <Wordmark className="wordmark wordmark-hero" />
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
    </section>
  );
}
