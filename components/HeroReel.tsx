"use client";

import { useEffect, useState } from "react";

export const HERO_SLIDES = [
  { src: "/hero/lamborghini.jpg", brand: "Lamborghini", idx: "01" },
  { src: "/hero/ferrari.jpg", brand: "Ferrari", idx: "02" },
  { src: "/hero/rolls-royce.jpg", brand: "Rolls-Royce", idx: "03" },
  { src: "/hero/maybach.jpg", brand: "Maybach", idx: "04" },
] as const;

const INTERVAL_MS = 5600;

export function HeroReel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [index]);

  const current = HERO_SLIDES[index];

  return (
    <>
      <div className="hero-reel" aria-hidden>
        {HERO_SLIDES.map((slide, i) => (
          <div key={slide.src} className={`hero-slide${i === index ? " on" : ""}`}>
            <img src={slide.src} alt="" />
          </div>
        ))}
      </div>
      <p className="hero-reel-brand">
        <span>{current.idx} / 04</span>
        {current.brand}
      </p>
      <div className="hero-reel-ticks" aria-hidden>
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            data-on={i === index}
            onClick={() => setIndex(i)}
            aria-label={slide.brand}
          />
        ))}
      </div>
    </>
  );
}
