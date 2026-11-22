"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import ProductImage from "./ProductImage";
import { productBrand, productTags } from "@/lib/catalog";
import { convertAmount } from "@/lib/fx";
import { colorLabel, localizedName, styleText, t } from "@/lib/i18n";
import { formatMoney, savings } from "@/lib/money";
import type { Product } from "@/lib/types";
import { useMarket } from "./MarketProvider";

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const market = useMarket();
  const lang = market.lang;
  const name = localizedName(product, lang);
  const price = convertAmount(product.price, market.currency, market.rates);
  const compare = product.compareAt ? convertAmount(product.compareAt, market.currency, market.rates) : undefined;
  const money = (amount: number) => formatMoney(amount, market.currency, lang);
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
      <Link href={`/products/${product.slug}`} className="card-media" aria-label={name}>
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
          {product.isNew && <span className="badge">{t(lang, "new")}</span>}
          {savings(price, compare) > 0 && (
            <span className="badge badge-gold">{t(lang, "save", { amount: money(savings(price, compare)) })}</span>
          )}
        </span>
      </Link>
      <div className="card-info">
        {productBrand(product) && <p className="card-brand">{productBrand(product)}</p>}
        <div className="card-row">
          <Link href={`/products/${product.slug}`} className="card-name">
            {name}
          </Link>
          <span className="price price-sticker">
            {savings(price, compare) > 0 && <s>{money(compare!)}</s>}
            {money(price)}
          </span>
        </div>
        <div className="card-row card-sub">
          <span>
            {styleText(product.style, lang)}
            {productTags(product).length > 0 ? ` · ${productTags(product).join(" / ")}` : ""}
          </span>
          <span className="swatches" role="group" aria-label={t(lang, "colour")}>
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                className="swatch"
                data-active={c.name === colorName}
                style={{ background: c.hex }}
                aria-label={colorLabel(c.name, lang)}
                title={colorLabel(c.name, lang)}
                onClick={() => setColorName(c.name)}
              />
            ))}
          </span>
        </div>
      </div>
    </article>
  );
}
