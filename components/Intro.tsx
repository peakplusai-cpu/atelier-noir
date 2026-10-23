"use client";

import { useEffect, useState } from "react";
import { FILLS, INTRO_TOTAL, MASK, SWASH } from "@/lib/intro-lettering";

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
          <mask id="intro-write" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="600">
            <rect width="1600" height="600" fill="#000" />
            <path
              d={MASK.d}
              pathLength={1}
              className="intro-stroke"
              strokeWidth={MASK.width}
              style={{
                ["--delay" as string]: `${MASK.delay}s`,
                ["--dur" as string]: `${MASK.dur}s`,
                ["--peak" as string]: 1,
              }}
            />
          </mask>
        </defs>
        <g mask="url(#intro-write)" className="intro-fill">
          {FILLS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path
          d={SWASH.d}
          pathLength={1}
          className="intro-stroke"
          strokeWidth={SWASH.width}
          style={{
            ["--delay" as string]: `${SWASH.delay}s`,
            ["--dur" as string]: `${SWASH.dur}s`,
            ["--peak" as string]: SWASH.opacity ?? 1,
          }}
        />
      </svg>

      <div className="intro-caption">
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
