import { t } from "@/lib/i18n";
import { getMarket } from "@/lib/market-server";
import { wallFrames } from "@/lib/wall";
import type { WallPost } from "@/lib/promos";
import type { Product } from "@/lib/types";
import Link from "next/link";
import { WallImage } from "./WallImage";

export async function PhotoWall({ posts, products }: { posts: WallPost[]; products: Product[] }) {
  const { lang } = await getMarket();
  const frames = wallFrames(posts, products);
  if (!frames.length) return null;
  return (
    <section className="bay-wall" aria-label={t(lang, "wall")}>
      <div className="bay-wall-viewport">
        <div className="bay-wall-track">
          <div className="bay-wall-set">
            {frames.map((frame) => {
              const image = <WallImage src={frame.image} alt={frame.caption || "CLACK"} />;
              return frame.href ? (
                <Link key={frame.key} href={frame.href} className="bay-wall-item">
                  {image}
                </Link>
              ) : (
                <div key={frame.key} className="bay-wall-item">
                  {image}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
