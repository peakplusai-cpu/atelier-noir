"use client";

import { useMemo, useState } from "react";
import ProductImage from "./ProductImage";
import { ModelInfo, SizeGuidePanel, UnitToggle } from "./SizeGuide";
import { useCart } from "./CartProvider";
import { Accordion, AccordionItem } from "./Accordion";
import { STYLE_LABELS, productBrand, productTags, sizeLabel, stockOf } from "@/lib/catalog";
import { formatUsd, savings } from "@/lib/money";
import { useCatalog } from "./CatalogProvider";
import { HYGIENE_COPY, RETURNS_COPY, SHIPPING_COPY } from "@/lib/policies";
import { SITE } from "@/lib/site";
import type { Unit } from "@/lib/sizes";
import type { Product } from "@/lib/types";
import type { ArtView } from "./ProductArt";

type Slide = { id: string; label: string; view: ArtView; src?: string; video?: string };

const SLIDES: Slide[] = [
  { id: "front", label: "Front", view: "front" },
  { id: "back", label: "Back", view: "back" },
  { id: "detail", label: "Detail", view: "detail" },
  { id: "fabric", label: "Fabric", view: "fabric" },
];

export default function PdpClient({ product }: { product: Product }) {
  const { add } = useCart();
  const { settings } = useCatalog();
  const [colorName, setColorName] = useState(product.colors[0].name);
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [slide, setSlide] = useState(0);
  const [unit, setUnit] = useState<Unit>("cm");
  const [guideOpen, setGuideOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const [added, setAdded] = useState(false);

  const complete = product.selectors.every((s) => sizes[s.key]);
  const available = complete ? stockOf(product, colorName, sizeLabel(product, sizes)) : null;
  const soldOut = available === 0;
  const highlight = useMemo(() => sizes[product.selectors[0].key], [sizes, product.selectors]);
  const slides: Slide[] = [
    ...SLIDES,
    ...(product.media?.gallery ?? []).map((src, i) => ({ id: src, label: `Photo ${i + 1}`, view: "front" as const, src })),
    ...(product.media?.video ? [{ id: "video", label: "In motion", view: "front" as const, video: product.media.video }] : []),
  ];

  const onAdd = () => {
    if (!complete || soldOut) {
      setShowError(true);
      return;
    }
    add({ slug: product.slug, color: colorName, sizes });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const current = slides[slide] ?? slides[0];

  return (
    <div className="pdp">
      <div className="pdp-gallery">
        <ul className="thumbs" aria-label="Product views">
          {slides.map((s, i) => (
            <li key={s.id}>
              <button type="button" data-active={i === slide} onClick={() => setSlide(i)} aria-label={`${s.label} view`}>
                {s.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.src} alt="" className="art" />
                ) : s.video ? (
                  <span className="thumb-video">Video</span>
                ) : (
                  <ProductImage product={product} view={s.view} colorName={colorName} />
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="gallery-main">
          {current.video ? (
            <video className="art" src={current.video} muted loop playsInline autoPlay />
          ) : current.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.src} alt={product.name} className="art" />
          ) : (
            <ProductImage product={product} view={current.view} colorName={colorName} priority />
          )}
          <span className="gallery-label">{current.label}</span>
        </div>
      </div>

      <div className="pdp-info">
        <p className="eyebrow">{productBrand(product) || "CLACK"} · {STYLE_LABELS[product.style]}</p>
        <h1 className="serif">{product.name}</h1>
        {productTags(product).length > 0 && <p className="tag-row">{productTags(product).map((tag) => <span key={tag} className="sticker">{tag}</span>)}</p>}
        <p className="pdp-price price price-sticker">
          {savings(product.price, product.compareAt) > 0 && <s>{formatUsd(product.compareAt!)}</s>}
          {formatUsd(product.price)}
          <span className="usd"> USD</span>
        </p>
        <p className="pdp-tagline">{product.tagline}</p>

        <div className="opt">
          <p className="opt-label">
            Colour: <strong>{colorName}</strong>
          </p>
          <div className="swatches swatches-lg" role="radiogroup" aria-label="Colour">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={c.name === colorName}
                className="swatch"
                data-active={c.name === colorName}
                style={{ background: c.hex }}
                title={c.name}
                aria-label={c.name}
                onClick={() => setColorName(c.name)}
              />
            ))}
          </div>
        </div>

        {product.selectors.map((sel) => (
          <div className="opt" key={sel.key}>
            <div className="opt-head">
              <p className="opt-label">
                {sel.label}
                {sizes[sel.key] && <>: <strong>{sizes[sel.key]}</strong></>}
              </p>
              {sel === product.selectors[0] && (
                <button type="button" className="link-btn" onClick={() => setGuideOpen(true)}>
                  Size guide
                </button>
              )}
            </div>
            <div className="chips" role="radiogroup" aria-label={sel.label}>
              {sel.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={sizes[sel.key] === o}
                  className="chip chip-size"
                  data-active={sizes[sel.key] === o}
                  onClick={() => {
                    setSizes((prev) => ({ ...prev, [sel.key]: o }));
                    setShowError(false);
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="fit-note">
          <ModelInfo models={product.models} unit={unit} />
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>

        <div className="pdp-buy">
          <button type="button" className="btn btn-solid btn-block" onClick={onAdd} disabled={soldOut}>
            {soldOut ? "售完 Sold out" : added ? "已放入 Added to bag" : complete ? `加入購物袋 Add to bag \u00B7 ${formatUsd(product.price)}` : "先選尺寸 Select your size"}
          </button>
        </div>
        {showError && !complete && <p className="form-error" role="alert">Please choose your size to continue.</p>}
        {soldOut && <p className="form-error" role="alert">This size is sold out.</p>}
        <ul className="perks">
          <li>Free worldwide shipping over ${settings.freeShippingThreshold} USD</li>
          <li>{SITE.returnDays}-day returns</li>
          <li>Secure checkout</li>
        </ul>

        <p className="pdp-desc">{product.description}</p>

        <Accordion>
          <AccordionItem title="Details" defaultOpen>
            <ul className="bullets">
              {product.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </AccordionItem>
          <AccordionItem title="Size & Fit">
            <ModelInfo models={product.models} unit={unit} />
            <button type="button" className="link-btn" onClick={() => setGuideOpen(true)}>
              Open the full size chart ({unit === "cm" ? "cm" : "inch"})
            </button>
          </AccordionItem>
          {product.hygiene && (
            <AccordionItem title="Hygiene Liner">
              {HYGIENE_COPY.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </AccordionItem>
          )}
          <AccordionItem title="Shipping">
            {SHIPPING_COPY.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </AccordionItem>
          <AccordionItem title="Returns & Exchanges">
            {RETURNS_COPY.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </AccordionItem>
          <AccordionItem title="Fabric & Care">
            <ul className="bullets">
              {product.care.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="modal" data-open={guideOpen} role="dialog" aria-modal="true" aria-label="Size guide" aria-hidden={!guideOpen}>
        <div className="modal-scrim" onClick={() => setGuideOpen(false)} />
        <div className="modal-card">
          <div className="modal-head">
            <h2 className="serif">Size guide</h2>
            <button type="button" className="icon-btn" aria-label="Close size guide" onClick={() => setGuideOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M5 5l12 12M17 5L5 17" />
              </svg>
            </button>
          </div>
          {guideOpen && (
            <SizeGuidePanel
              charts={product.charts}
              models={product.models}
              unit={unit}
              onUnit={setUnit}
              highlight={highlight}
            />
          )}
        </div>
      </div>
    </div>
  );
}
