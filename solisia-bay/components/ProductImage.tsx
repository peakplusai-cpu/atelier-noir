import Image from "next/image";
import ProductArt, { type ArtView } from "./ProductArt";
import type { Product } from "@/lib/types";
import { products } from "@/lib/catalog";

export function toneOf(p: Product): number {
  return Math.max(0, products.findIndex((x) => x.slug === p.slug));
}

export default function ProductImage({
  product,
  view,
  colorName,
  priority,
  stamp = "",
}: {
  product: Product;
  view: ArtView;
  colorName?: string;
  priority?: boolean;
  stamp?: string;
}) {
  const color = product.colors.find((c) => c.name === colorName) ?? product.colors[0];
  const photo = view === "front" ? product.media?.front : view === "back" ? product.media?.back : undefined;
  if (photo) {
    if (photo.startsWith("/")) {
      return (
        <Image
          src={photo}
          alt={`${product.name}, ${view}`}
          fill
          sizes="(max-width: 760px) 50vw, 25vw"
          className="art"
          priority={priority}
        />
      );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={`${product.name}, ${view}`} className="art" loading={priority ? "eager" : "lazy"} decoding="async" />;
  }
  return (
    <ProductArt
      kinds={product.art}
      color={color.hex}
      finish={product.finish}
      view={view}
      uid={`${product.slug}-${color.name.replace(/\W/g, "")}-${view}${stamp}`}
      tone={toneOf(product)}
      title={`${product.name} in ${color.name}, ${view} view`}
    />
  );
}
