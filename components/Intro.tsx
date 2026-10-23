"use client";

import { useEffect, useState } from "react";
import { FILLS, FILL_TRANSFORM, INTRO_TOTAL, MASKS, VIEW_W } from "@/lib/intro-logo";

const STORAGE_KEY = "ch-intro-seen";
const EXIT_MS = 1100;
const HOLD = 0.8;
const CROP_Y = 120;
const CROP_H = 570;

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
    const timer = window.setTimeout(finish, (INTRO_TOTAL + HOLD) * 1000 + EXIT_MS + 100);

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
      style={{
        ["--exit-delay" as string]: `${INTRO_TOTAL + HOLD}s`,
        ["--caption-delay" as string]: `${INTRO_TOTAL - 0.5}s`,
      }}
      onClick={() => setSkipping(true)}
      aria-hidden
    >
      <svg
        className="intro-art"
        viewBox={`0 ${CROP_Y} ${VIEW_W} ${CROP_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <mask id="intro-write" maskUnits="userSpaceOnUse" x="0" y={CROP_Y} width={VIEW_W} height={CROP_H}>
            <rect x="0" y={CROP_Y} width={VIEW_W} height={CROP_H} fill="#000" />
            {MASKS.map((m, i) => (
              <path
                key={i}
                d={m.d}
                pathLength={1}
                className="intro-stroke"
                strokeWidth={m.width}
                style={{
                  ["--delay" as string]: `${m.delay}s`,
                  ["--dur" as string]: `${m.dur}s`,
                }}
              />
            ))}
          </mask>
        </defs>
        <g mask="url(#intro-write)" className="intro-fill">
          <g transform={FILL_TRANSFORM} fillRule="evenodd">
            {FILLS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </g>
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
