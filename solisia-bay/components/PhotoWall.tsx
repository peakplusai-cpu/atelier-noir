import Link from "next/link";
import { t } from "@/lib/i18n";
import { getMarket } from "@/lib/market-server";
import { wallFrames } from "@/lib/wall";
import type { WallPost } from "@/lib/promos";
import type { Product } from "@/lib/types";

export async function PhotoWall({ posts, products }: { posts: WallPost[]; products: Product[] }) {
  const { lang } = await getMarket();
  const frames = wallFrames(posts, products);
  if (!frames.length) return null;
  const seconds = Math.max(28, frames.length * 6);
  const strip = (copy: string, hidden = false) =>
    frames.map((frame, index) => {
      const key = `${copy}-${frame.key}-${index}`;
      const inner = (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={frame.image} alt={hidden ? "" : frame.caption || "CLACK"} loading="lazy" decoding="async" />
          {frame.caption ? <span className="bay-wall-caption">{frame.caption}</span> : null}
        </>
      );
      return frame.href ? (
        <Link key={key} href={frame.href} className="bay-wall-item" tabIndex={hidden ? -1 : undefined}>
          {inner}
        </Link>
      ) : (
        <div key={key} className="bay-wall-item">
          {inner}
        </div>
      );
    });
  return (
    <section className="bay-wall" aria-label={t(lang, "wall")} style={{ ["--wall-duration" as string]: `${seconds}s` }}>
      <div className="bay-wall-viewport">
        <div className="bay-wall-track">
          <div className="bay-wall-set">{strip("a")}</div>
          <div className="bay-wall-set" aria-hidden="true">
            {strip("b", true)}
          </div>
        </div>
      </div>
    </section>
  );
}
