import Link from "next/link";
import { SITE } from "@/lib/site";

const FROND = "M0 0 C 90 -70 270 -64 400 48 C 280 -6 110 -22 0 0 Z";

function Palm({ x, y, scale = 1, flip = false }: { x: number; y: number; scale?: number; flip?: boolean }) {
  const angles = [-8, 12, 32, 52, 72, 92, 112];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} fill="#0E2140">
      {angles.map((a, i) => (
        <path key={a} d={FROND} transform={`rotate(${a}) scale(${0.78 + (i % 3) * 0.14})`} opacity={0.94 - (i % 2) * 0.08} />
      ))}
    </g>
  );
}

function Scene() {
  return (
    <svg className="hero-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EDE3D3" />
          <stop offset="0.55" stopColor="#F3D7B4" />
          <stop offset="1" stopColor="#F0BF92" />
        </linearGradient>
        <linearGradient id="hs-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7FA2B8" />
          <stop offset="0.45" stopColor="#3A6283" />
          <stop offset="1" stopColor="#15294A" />
        </linearGradient>
        <radialGradient id="hs-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4D8" />
          <stop offset="0.45" stopColor="#F2D49A" />
          <stop offset="1" stopColor="#C5A059" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hs-shade" x1="0" y1="1" x2="0.6" y2="0">
          <stop offset="0" stopColor="#0B1B33" stopOpacity="0.62" />
          <stop offset="0.55" stopColor="#0B1B33" stopOpacity="0.12" />
          <stop offset="1" stopColor="#0B1B33" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#hs-sky)" />
      <circle cx="1090" cy="470" r="330" fill="url(#hs-sun)" opacity="0.8" />
      <circle cx="1090" cy="470" r="86" fill="#FBEBC6" />
      <path d="M0 520 Q 400 505 800 520 T 1600 520 L1600 900 L0 900 Z" fill="url(#hs-sea)" />
      <rect y="514" width="1600" height="8" fill="#F5DDB7" opacity="0.5" />
      <g className="hero-glint" stroke="#FFF1CF" strokeLinecap="round" strokeWidth="3">
        {[
          [1010, 548, 160],
          [1040, 580, 110],
          [980, 612, 190],
          [1070, 648, 120],
          [1000, 690, 220],
          [1050, 740, 150],
          [960, 790, 240],
        ].map(([x, y, w], i) => (
          <line key={i} x1={x} y1={y} x2={x + w} y2={y} opacity={0.75 - i * 0.07} />
        ))}
      </g>
      <g className="hero-waves" fill="none" stroke="#fff" strokeLinecap="round">
        <path className="w1" d="M-200 700 q 100 -22 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0" strokeWidth="2" opacity="0.28" />
        <path className="w2" d="M-300 770 q 100 -26 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0" strokeWidth="2.4" opacity="0.22" />
        <path className="w3" d="M-100 840 q 120 -30 240 0 t 240 0 t 240 0 t 240 0 t 240 0 t 240 0 t 240 0 t 240 0 t 240 0" strokeWidth="2.6" opacity="0.18" />
      </g>
      <Palm x={-40} y={-30} scale={1.35} />
      <Palm x={1640} y={-50} scale={1.05} flip />
      <rect width="1600" height="900" fill="url(#hs-shade)" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="hero" aria-label="Resort 2027">
      <div className="hero-media">
        {SITE.heroVideo ? (
          <video src={SITE.heroVideo} autoPlay muted loop playsInline poster={SITE.heroImage || undefined} />
        ) : SITE.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={SITE.heroImage} alt="" />
        ) : (
          <Scene />
        )}
      </div>
      <div className="hero-copy">
        <p className="eyebrow light">Resort 2027</p>
        <h1 className="serif">
          Slow tides,
          <br />
          <em>golden hours.</em>
        </h1>
        <p className="hero-sub">Island resort wear for her, for him, and for the two of you.</p>
        <div className="hero-cta">
          <Link href="/collection/women" className="btn btn-light">
            Shop Women
          </Link>
          <Link href="/collection/men" className="btn btn-light">
            Shop Men
          </Link>
          <Link href="/collection/couples" className="btn btn-ghost-light">
            Couples Sets
          </Link>
        </div>
      </div>
      <a href="#entry" className="hero-scroll" aria-label="Scroll to explore">
        <span />
      </a>
    </section>
  );
}
