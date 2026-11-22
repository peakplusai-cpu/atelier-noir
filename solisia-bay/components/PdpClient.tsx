"use client";

import { useMemo, useRef, useState } from "react";
import ProductImage from "./ProductImage";
import { ModelInfo, SizeGuidePanel, UnitToggle } from "./SizeGuide";
import { useCart } from "./CartProvider";
import { useCatalog } from "./CatalogProvider";
import { Accordion, AccordionItem } from "./Accordion";
import { productBrand, productTags, sizeLabel, stockOf } from "@/lib/catalog";
import { convertAmount } from "@/lib/fx";
import { colorLabel, localizedDescription, localizedName, styleText, t, type MessageKey } from "@/lib/i18n";
import { formatMoney, savings } from "@/lib/money";
import { returnsCopy, shippingCopy } from "@/lib/policies";
import type { Unit } from "@/lib/sizes";
import type { Product } from "@/lib/types";
import type { ArtView } from "./ProductArt";
import { useMarket } from "./MarketProvider";

type Slide = { id: string; label: string; view: ArtView; src?: string; video?: string };

const SLIDES: Slide[] = [
  { id: "front", label: "front", view: "front" },
  { id: "back", label: "back", view: "back" },
  { id: "detail", label: "detail", view: "detail" },
  { id: "fabric", label: "fabric", view: "fabric" },
];

export default function PdpClient({ product }: { product: Product }) {
  const { add } = useCart();
  const { settings } = useCatalog();
  const market = useMarket();
  const lang = market.lang;
  const name = localizedName(product, lang);
  const description = localizedDescription(product, lang);
  const price = convertAmount(product.price, market.currency, market.rates);
  const compare = product.compareAt ? convertAmount(product.compareAt, market.currency, market.rates) : undefined;
  const money = (amount: number) => formatMoney(amount, market.currency, lang);
  const threshold = formatMoney(convertAmount(settings.freeShippingThreshold, market.currency, market.rates), market.currency, lang);
  const flat = formatMoney(convertAmount(settings.flatShipping, market.currency, market.rates), market.currency, lang);
  const [colorName, setColorName] = useState(product.colors[0].name);
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [slide, setSlide] = useState(0);
  const [unit, setUnit] = useState<Unit>("cm");
  const [guideOpen, setGuideOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const [added, setAdded] = useState(false);
  const swipeRef = useRef<HTMLDivElement>(null);

  const complete = product.selectors.every((s) => sizes[s.key]);
  const available = complete ? stockOf(product, colorName, sizeLabel(product, sizes)) : null;
  const soldOut = available === 0;
  const highlight = useMemo(() => sizes[product.selectors[0].key], [sizes, product.selectors]);
  const slides: Slide[] = [
    ...SLIDES,
    ...(product.media?.gallery ?? []).map((src, i) => ({ id: src, label: t(lang, "photo", { n: i + 1 }), view: "front" as const, src })),
    ...(product.media?.video ? [{ id: "video", label: t(lang, "inMotion"), view: "front" as const, video: product.media.video }] : []),
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
  const slideLabel = (s: Slide) => (s.label in { front: 1, back: 1, detail: 1, fabric: 1 } ? t(lang, s.label as MessageKey) : s.label);
  const goToSlide = (index: number) => {
    const scroller = swipeRef.current;
    if (scroller) scroller.scrollTo({ left: index * scroller.clientWidth, behavior: "smooth" });
    setSlide(index);
  };

  return (
    <div className="pdp">
      <div className="pdp-gallery">
        <ul className="thumbs" aria-label={t(lang, "views")}>
          {slides.map((s, i) => (
            <li key={s.id}>
              <button type="button" data-active={i === slide} onClick={() => goToSlide(i)} aria-label={t(lang, "view", { label: slideLabel(s) })}>
                {s.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.src} alt="" className="art" />
                ) : s.video ? (
                  <span className="thumb-video">{t(lang, "video")}</span>
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
            <img src={current.src} alt={name} className="art" />
          ) : (
            <ProductImage product={product} view={current.view} colorName={colorName} priority />
          )}
          <span className="gallery-label">{slideLabel(current)}</span>
        </div>
        <div
          className="gallery-swipe"
          ref={swipeRef}
          onScroll={(event) => {
            const scroller = event.currentTarget;
            if (!scroller.clientWidth) return;
            const index = Math.round(scroller.scrollLeft / scroller.clientWidth);
            setSlide((prev) => (prev === index ? prev : index));
          }}
        >
          {slides.map((s) => (
            <div className="gallery-frame" key={s.id}>
              {s.video ? (
                <video className="art" src={s.video} muted loop playsInline autoPlay />
              ) : s.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.src} alt={name} className="art" />
              ) : (
                <ProductImage product={product} view={s.view} colorName={colorName} priority={s.id === "front"} stamp="-swipe" />
              )}
            </div>
          ))}
        </div>
        <div className="gallery-dots" role="tablist" aria-label={t(lang, "views")}>
          {slides.map((s, i) => (
            <button key={s.id} type="button" role="tab" data-active={i === slide} aria-selected={i === slide} aria-label={slideLabel(s)} onClick={() => goToSlide(i)} />
          ))}
        </div>
      </div>

      <div className="pdp-info">
        <p className="eyebrow">{productBrand(product) || "CLACK"} · {styleText(product.style, lang)}</p>
        <h1 className="serif">{name}</h1>
        {productTags(product).length > 0 && <p className="tag-row">{productTags(product).map((tag) => <span key={tag} className="sticker">{tag}</span>)}</p>}
        <p className="pdp-price price price-sticker">
          {savings(price, compare) > 0 && <s>{money(compare!)}</s>}
          {money(price)}
        </p>

        <div className="opt">
          <p className="opt-label">
            {t(lang, "colour")}: <strong>{colorLabel(colorName, lang)}</strong>
          </p>
          <div className="swatches swatches-lg" role="radiogroup" aria-label={t(lang, "colour")}>
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={c.name === colorName}
                className="swatch"
                data-active={c.name === colorName}
                style={{ background: c.hex }}
                title={colorLabel(c.name, lang)}
                aria-label={colorLabel(c.name, lang)}
                onClick={() => setColorName(c.name)}
              />
            ))}
          </div>
        </div>

        {product.selectors.map((sel) => (
          <div className="opt" key={sel.key}>
            <div className="opt-head">
              <p className="opt-label">
                {sel.label === "Size" ? t(lang, "size") : sel.label}
                {sizes[sel.key] && <>: <strong>{sizes[sel.key]}</strong></>}
              </p>
              {sel === product.selectors[0] && (
                <button type="button" className="link-btn" onClick={() => setGuideOpen(true)}>
                  {t(lang, "sizeGuide")}
                </button>
              )}
            </div>
            <div className="chips" role="radiogroup" aria-label={sel.label === "Size" ? t(lang, "size") : sel.label}>
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
            {soldOut ? t(lang, "soldOut") : added ? t(lang, "added") : complete ? `${t(lang, "addToBag")} \u00B7 ${money(price)}` : t(lang, "selectSize")}
          </button>
        </div>
        {showError && !complete && <p className="form-error" role="alert">{t(lang, "chooseSize")}</p>}
        {soldOut && <p className="form-error" role="alert">{t(lang, "sizeSoldOut")}</p>}

        <p className="pdp-desc">{description}</p>

        <Accordion>
          <AccordionItem title={t(lang, "details")} defaultOpen>
            <ul className="bullets">
              {product.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </AccordionItem>
          <AccordionItem title={t(lang, "sizeFit")}>
            <ModelInfo models={product.models} unit={unit} />
            <button type="button" className="link-btn" onClick={() => setGuideOpen(true)}>
              {t(lang, "openChart", { unit: unit === "cm" ? "cm" : "inch" })}
            </button>
          </AccordionItem>
          <AccordionItem title={t(lang, "shipping")}>
            {shippingCopy(lang, threshold, flat).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </AccordionItem>
          <AccordionItem title={t(lang, "returns")}>
            {returnsCopy(lang).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </AccordionItem>
          <AccordionItem title={t(lang, "fabricCare")}>
            <ul className="bullets">
              {product.care.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="modal" data-open={guideOpen} role="dialog" aria-modal="true" aria-label={t(lang, "sizeGuide")} aria-hidden={!guideOpen}>
        <div className="modal-scrim" onClick={() => setGuideOpen(false)} />
        <div className="modal-card">
          <div className="modal-head">
            <h2 className="serif">{t(lang, "sizeGuide")}</h2>
            <button type="button" className="icon-btn" aria-label={t(lang, "closeGuide")} onClick={() => setGuideOpen(false)}>
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
