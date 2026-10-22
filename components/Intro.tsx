"use client";

import { useEffect, useState } from "react";
import { INTRO_TOTAL, STROKES } from "@/lib/maybach-lines";

const STORAGE_KEY = "ch-intro-seen";
const EXIT_MS = 1100;

export function Intro() {
  const [mounted, setMounted] = useState(true);
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const forced = new URLSearchParams(window.location.search).has("intro");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = !forced && (root.classList.contains("intro-seen") || sessionStorage.getItem(STORAGE_KEY));

    if (seen || reduce) {
      root.classList.remove("intro-lock");
      root.classList.add("intro-seen");
      setMounted(false);
      return;
    }

    root.classList.add("intro-lock");
    root.classList.remove("intro-seen");
    const timer = window.setTimeout(finish, (INTRO_TOTAL + 1.2) * 1000 + EXIT_MS);

    function finish() {
      sessionStorage.setItem(STORAGE_KEY, "1");
      root.classList.remove("intro-lock");
      root.classList.add("intro-seen");
      setMounted(false);
    }

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!skipping) return;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      document.documentElement.classList.remove("intro-lock");
      document.documentElement.classList.add("intro-seen");
      setMounted(false);
    }, 750);
    return () => window.clearTimeout(timer);
  }, [skipping]);

  if (!mounted) return null;

  return (
    <div
      className={`intro${skipping ? " is-skipping" : ""}`}
      style={{ ["--exit-delay" as string]: `${INTRO_TOTAL + 1.2}s` }}
      onClick={() => setSkipping(true)}
      aria-hidden
    >
      <svg className="intro-art" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="intro-glow" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#intro-glow)">
          {STROKES.map((s, i) => (
            <path
              key={i}
              d={s.d}
              pathLength={1}
              className="intro-stroke"
              strokeWidth={s.width}
              style={{
                ["--delay" as string]: `${s.delay}s`,
                ["--dur" as string]: `${s.dur}s`,
                ["--peak" as string]: s.opacity ?? 1,
              }}
            />
          ))}
        </g>
      </svg>

      <div className="intro-caption">
        <span className="intro-mark">BRYAN&apos;S GARAGE</span>
        <span className="intro-sub">TAICHUNG · TXG</span>
      </div>

      <button
        type="button"
        className="intro-skip"
        onClick={(e) => {
          e.stopPropagation();
          setSkipping(true);
        }}
      >
        SKIP <span aria-hidden>→</span>
      </button>
    </div>
  );
}
