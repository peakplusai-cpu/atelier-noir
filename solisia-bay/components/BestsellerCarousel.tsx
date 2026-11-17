"use client";

import { useRef } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

export default function BestsellerCarousel({ items }: { items: Product[] }) {
  const track = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".slide");
    const step = (card?.offsetWidth ?? 320) + 24;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  return (
    <div className="carousel">
      <div className="carousel-controls">
        <button type="button" className="round-btn" aria-label="Previous products" onClick={() => scroll(-1)}>
          &larr;
        </button>
        <button type="button" className="round-btn" aria-label="Next products" onClick={() => scroll(1)}>
          &rarr;
        </button>
      </div>
      <div className="carousel-track" ref={track} tabIndex={0} aria-label="Best sellers">
        {items.map((p, i) => (
          <div className="slide" key={p.slug}>
            <ProductCard product={p} priority={i < 3} />
          </div>
        ))}
      </div>
    </div>
  );
}
