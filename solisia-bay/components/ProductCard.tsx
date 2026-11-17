"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import ProductImage from "./ProductImage";
import { STYLE_LABELS } from "@/lib/catalog";
import { formatUsd, savings } from "@/lib/money";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const [colorName, setColorName] = useState(product.colors[0].name);
  const videoRef = useRef<HTMLVideoElement>(null);
  const video = product.media?.video;

  const play = () => {
    const v = videoRef.current;
    if (v) void v.play().catch(() => undefined);
  };
  const stop = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <article className="card" onMouseEnter={play} onMouseLeave={stop}>
      <Link href={`/products/${product.slug}`} className="card-media" aria-label={product.name}>
        <span className="card-layer card-front">
          <ProductImage product={product} view="front" colorName={colorName} priority={priority} />
        </span>
        <span className="card-layer card-back">
          <ProductImage product={product} view="back" colorName={colorName} />
        </span>
        {video && (
          <video ref={videoRef} className="card-video" src={video} muted loop playsInline preload="none" aria-hidden />
        )}
        <span className="badges">
          {product.isNew && <span className="badge">New</span>}
          {savings(product.price, product.compareAt) > 0 && (
            <span className="badge badge-gold">Save {formatUsd(savings(product.price, product.compareAt))}</span>
          )}
        </span>
      </Link>
      <div className="card-info">
        <div className="card-row">
          <Link href={`/products/${product.slug}`} className="card-name">
            {product.name}
          </Link>
          <span className="price">
            {savings(product.price, product.compareAt) > 0 && <s>{formatUsd(product.compareAt!)}</s>}
            {formatUsd(product.price)}
          </span>
        </div>
        <div className="card-row card-sub">
          <span>{STYLE_LABELS[product.style]}</span>
          <span className="swatches" role="group" aria-label="Colour">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                className="swatch"
                data-active={c.name === colorName}
                style={{ background: c.hex }}
                aria-label={c.name}
                title={c.name}
                onClick={() => setColorName(c.name)}
              />
            ))}
          </span>
        </div>
      </div>
    </article>
  );
}
