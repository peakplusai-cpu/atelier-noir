import { allowedImageUrl } from "./csp";
import type { WallPost } from "./promos";
import { isPublished } from "./catalog";
import type { Product } from "./types";

export type WallFrame = {
  key: string;
  image: string;
  caption: string;
  href: string;
};

/** Repeats a short wall until the marquee has enough frames to scroll. */
export function wallFrames(posts: WallPost[], products: Product[]): WallFrame[] {
  const live = new Map(products.filter(isPublished).map((product) => [product.slug, product]));
  const frames: WallFrame[] = [];
  for (const post of posts) {
    if (!post.published || !post.image || !allowedImageUrl(post.image)) continue;
    const slug = /^[a-z0-9-]+$/.test(post.slug) ? post.slug : "";
    const product = slug ? live.get(slug) : undefined;
    frames.push({
      key: post.id || post.image,
      image: post.image,
      caption: (post.caption || product?.name || "").slice(0, 180),
      href: product ? `/products/${product.slug}` : "",
    });
  }
  if (!frames.length) return [];
  const unit = [...frames];
  while (unit.length < 6) unit.push(...frames);
  return unit;
}
