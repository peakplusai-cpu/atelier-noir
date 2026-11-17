import type { ReactNode } from "react";
import type { ArtKind, Finish } from "@/lib/types";
import { darken, lighten, luminance, mix } from "@/lib/color";

export type ArtView = "front" | "back" | "detail" | "fabric";

type Ctx = {
  uid: string;
  base: string;
  dark: string;
  light: string;
  gold: string;
  finish: Finish;
  view: "front" | "back";
};

const GOLD = "#C5A059";

const PLATES = [
  { a: "#F4EEE4", b: "#E6DAC6", arch: "#FBF8F2" },
  { a: "#E9EEF0", b: "#CFDCE2", arch: "#F5F8F9" },
  { a: "#F5E8DA", b: "#E8CFB2", arch: "#FCF4EA" },
  { a: "#ECE9E0", b: "#D6D0BF", arch: "#F7F5EF" },
];
const DARK_PLATES = [
  { a: "#DCCDB4", b: "#C4B08F", arch: "#ECE2D0" },
  { a: "#B9CBD4", b: "#9FB6C2", arch: "#D4E0E6" },
];

function Piece({ d, ctx }: { d: string; ctx: Ctx }) {
  return (
    <>
      <path d={d} fill={`url(#${ctx.uid}-g)`} />
      {ctx.finish !== "solid" && <path d={d} fill={`url(#${ctx.uid}-f)`} />}
    </>
  );
}

function Seam({ d, ctx, w = 1.4, o = 0.45 }: { d: string; ctx: Ctx; w?: number; o?: number }) {
  return <path d={d} fill="none" stroke={ctx.dark} strokeOpacity={o} strokeWidth={w} strokeLinecap="round" />;
}

function Cord({ d, ctx, w = 3.2 }: { d: string; ctx: Ctx; w?: number }) {
  return <path d={d} fill="none" stroke={ctx.base} strokeWidth={w} strokeLinecap="round" />;
}

function Ring({ x, y, r = 5, ctx }: { x: number; y: number; r?: number; ctx: Ctx }) {
  return <circle cx={x} cy={y} r={r} fill="none" stroke={ctx.gold} strokeWidth={2.4} />;
}

const mirror = (children: ReactNode) => <g transform="translate(400 0) scale(-1 1)">{children}</g>;

function TriangleTop({ ctx }: { ctx: Ctx }) {
  const cup = "M 158 178 Q 130 250 98 300 Q 150 324 192 314 Q 182 250 158 178 Z";
  if (ctx.view === "back") {
    return (
      <g>
        <Cord ctx={ctx} d="M 98 300 Q 150 268 192 262" />
        <Cord ctx={ctx} d="M 302 300 Q 250 268 208 262" />
        <Cord ctx={ctx} d="M 158 178 Q 180 130 200 96" />
        <Cord ctx={ctx} d="M 242 178 Q 220 130 200 96" />
        <path d="M 200 262 Q 176 238 170 262 Q 178 284 200 264 Q 222 284 230 262 Q 224 238 200 262 Z" fill={ctx.base} />
        <Cord ctx={ctx} d="M 200 266 Q 188 306 176 330" />
        <Cord ctx={ctx} d="M 200 266 Q 212 306 224 330" />
        <path d="M 200 96 Q 184 78 176 92 Q 186 108 200 98 Q 214 108 224 92 Q 216 78 200 96 Z" fill={ctx.base} />
        <Cord ctx={ctx} d="M 200 100 Q 192 126 186 146" />
        <Cord ctx={ctx} d="M 200 100 Q 208 126 214 146" />
        <Piece ctx={ctx} d="M 98 300 Q 112 270 128 262 Q 122 296 98 300 Z" />
        {mirror(<Piece ctx={ctx} d="M 98 300 Q 112 270 128 262 Q 122 296 98 300 Z" />)}
      </g>
    );
  }
  return (
    <g>
      <Cord ctx={ctx} d="M 158 178 Q 180 126 200 80" />
      <Cord ctx={ctx} d="M 242 178 Q 220 126 200 80" />
      <Cord ctx={ctx} d="M 98 300 Q 62 304 24 296" />
      <Cord ctx={ctx} d="M 302 300 Q 338 304 376 296" />
      <Piece ctx={ctx} d={cup} />
      {mirror(<Piece ctx={ctx} d={cup} />)}
      <Seam ctx={ctx} d="M 154 196 Q 150 262 190 308" />
      <Seam ctx={ctx} d="M 246 196 Q 250 262 210 308" />
      <Cord ctx={ctx} d="M 192 314 Q 200 318 208 314" w={2.4} />
      <Ring ctx={ctx} x={200} y={316} r={6} />
    </g>
  );
}

function BandeauTop({ ctx }: { ctx: Ctx }) {
  const band = "M 86 222 Q 200 240 314 222 Q 322 262 314 302 Q 200 322 86 302 Q 78 262 86 222 Z";
  if (ctx.view === "back") {
    return (
      <g>
        <Piece ctx={ctx} d={band} />
        <Seam ctx={ctx} d="M 120 232 Q 200 246 280 232" o={0.25} />
        <Seam ctx={ctx} d="M 120 292 Q 200 306 280 292" o={0.25} />
        <rect x={190} y={250} width={20} height={26} rx={3} fill="none" stroke={ctx.gold} strokeWidth={2.4} />
        <Cord ctx={ctx} d="M 200 222 Q 198 150 200 112" w={2.2} />
      </g>
    );
  }
  return (
    <g>
      <Cord ctx={ctx} d="M 100 224 Q 130 160 200 118 Q 270 160 300 224" w={2.4} />
      <Piece ctx={ctx} d={band} />
      <path d="M 186 226 Q 200 262 186 300 Q 200 306 214 300 Q 200 262 214 226 Q 200 232 186 226 Z" fill={ctx.dark} fillOpacity={0.35} />
      <Seam ctx={ctx} d="M 186 226 Q 200 262 186 300" o={0.5} />
      <Seam ctx={ctx} d="M 214 226 Q 200 262 214 300" o={0.5} />
      <Ring ctx={ctx} x={200} y={262} r={6} />
    </g>
  );
}

function BikiniBottom({ ctx }: { ctx: Ctx }) {
  if (ctx.view === "back") {
    return (
      <g>
        <Cord ctx={ctx} d="M 118 238 Q 80 242 44 230" w={5} />
        <Cord ctx={ctx} d="M 282 238 Q 320 242 356 230" w={5} />
        <Piece ctx={ctx} d="M 112 232 Q 200 256 288 232 Q 306 300 270 352 Q 200 402 130 352 Q 94 300 112 232 Z" />
        <Seam ctx={ctx} d="M 200 252 Q 204 320 200 396" o={0.35} />
        <Ring ctx={ctx} x={116} y={238} />
        {mirror(<Ring ctx={ctx} x={116} y={238} />)}
      </g>
    );
  }
  return (
    <g>
      <Cord ctx={ctx} d="M 128 236 Q 88 238 46 224" w={5} />
      <Cord ctx={ctx} d="M 272 236 Q 312 238 354 224" w={5} />
      <Piece ctx={ctx} d="M 124 230 Q 200 254 276 230 Q 272 292 244 342 Q 200 398 156 342 Q 128 292 124 230 Z" />
      <Seam ctx={ctx} d="M 140 252 Q 200 270 260 252" o={0.3} />
      <Seam ctx={ctx} d="M 200 270 L 200 372" o={0.25} />
      <Ring ctx={ctx} x={128} y={238} />
      {mirror(<Ring ctx={ctx} x={128} y={238} />)}
    </g>
  );
}

const ONE_LOWER =
  "Q 266 170 258 232 Q 250 272 264 312 Q 272 350 240 400 Q 200 440 160 400 Q 128 350 136 312 Q 150 272 142 232 Q 134 170 148 80 Z";

const HALTER_LOWER =
  "Q 264 200 258 232 Q 250 272 264 312 Q 272 350 240 400 Q 200 440 160 400 Q 128 350 136 312 Q 150 272 142 232 Q 136 200 138 154 Q 164 122 176 66 Z";

function OnePiece({ ctx, openBack }: { ctx: Ctx; openBack: boolean }) {
  if (ctx.view === "back") {
    const d = openBack
      ? `M 176 66 L 192 66 Q 184 190 200 292 Q 216 190 208 66 L 224 66 Q 236 122 262 154 ${HALTER_LOWER}`
      : `M 148 80 L 172 80 Q 200 120 228 80 L 252 80 ${ONE_LOWER}`;
    return (
      <g>
        <Piece ctx={ctx} d={d} />
        {openBack ? (
          <>
            <Seam ctx={ctx} d="M 200 292 L 200 420" o={0.3} />
            <Ring ctx={ctx} x={200} y={74} r={4} />
          </>
        ) : (
          <>
            <Seam ctx={ctx} d="M 200 120 L 200 424" o={0.3} />
            <Seam ctx={ctx} d="M 146 200 Q 200 218 254 200" o={0.3} />
          </>
        )}
      </g>
    );
  }
  const d = openBack
    ? `M 176 66 L 224 66 Q 236 122 262 154 ${HALTER_LOWER}`
    : `M 148 80 L 172 80 Q 200 200 228 80 L 252 80 ${ONE_LOWER}`;
  return (
    <g>
      <Piece ctx={ctx} d={d} />
      <Seam ctx={ctx} d="M 144 234 Q 200 252 256 234" o={0.28} />
      {openBack ? (
        <>
          <Seam ctx={ctx} d="M 150 156 Q 200 176 250 156" o={0.25} />
          <Ring ctx={ctx} x={200} y={150} r={5} />
        </>
      ) : (
        <>
          <Seam ctx={ctx} d="M 180 150 Q 196 214 200 244" o={0.3} />
          <Seam ctx={ctx} d="M 220 150 Q 204 214 200 244" o={0.3} />
          <Ring ctx={ctx} x={200} y={200} r={6} />
        </>
      )}
    </g>
  );
}

function Kaftan({ ctx }: { ctx: Ctx }) {
  const body =
    "M 150 78 Q 200 108 250 78 L 338 152 L 306 198 L 270 172 L 296 452 L 104 452 L 130 172 L 94 198 L 62 152 Z";
  if (ctx.view === "back") {
    return (
      <g>
        <Piece ctx={ctx} d={body} />
        <Seam ctx={ctx} d="M 200 100 L 200 450" o={0.25} />
        <Seam ctx={ctx} d="M 130 172 L 270 172" o={0.15} />
        <Seam ctx={ctx} d="M 106 440 Q 200 452 294 440" o={0.2} />
      </g>
    );
  }
  return (
    <g>
      <Piece ctx={ctx} d={body} />
      <path d="M 150 78 Q 200 108 250 78 L 200 190 Z" fill={ctx.dark} fillOpacity={0.45} />
      <Seam ctx={ctx} d="M 150 78 L 200 190 L 250 78" o={0.6} w={1.6} />
      <Seam ctx={ctx} d="M 130 172 Q 200 186 270 172" o={0.2} />
      <path d="M 128 244 Q 200 262 272 244" fill="none" stroke={ctx.dark} strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round" />
      <path d="M 262 246 Q 276 290 268 322" fill="none" stroke={ctx.dark} strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
      <Seam ctx={ctx} d="M 106 440 Q 200 452 294 440" o={0.2} />
    </g>
  );
}

function CubanShirt({ ctx }: { ctx: Ctx }) {
  const body =
    "M 138 92 L 200 116 L 262 92 L 338 142 L 310 200 L 272 176 L 278 440 L 122 440 L 128 176 L 90 200 L 62 142 Z";
  if (ctx.view === "back") {
    return (
      <g>
        <Piece ctx={ctx} d={body} />
        <Piece ctx={ctx} d="M 138 92 Q 200 118 262 92 L 262 110 Q 200 134 138 110 Z" />
        <Seam ctx={ctx} d="M 128 160 Q 200 182 272 160" o={0.35} />
        <Seam ctx={ctx} d="M 200 134 L 200 150" o={0.35} />
        <Seam ctx={ctx} d="M 200 182 Q 196 300 200 438" o={0.2} />
        <Seam ctx={ctx} d="M 122 440 L 278 440" o={0.2} />
      </g>
    );
  }
  return (
    <g>
      <Piece ctx={ctx} d={body} />
      <path d="M 138 92 L 200 116 L 200 198 L 168 150 Z" fill={ctx.dark} fillOpacity={0.4} />
      <path d="M 262 92 L 200 116 L 200 198 L 232 150 Z" fill={ctx.dark} fillOpacity={0.4} />
      <Piece ctx={ctx} d="M 138 92 Q 176 100 200 116 L 188 208 Q 160 178 128 124 Z" />
      {mirror(<Piece ctx={ctx} d="M 138 92 Q 176 100 200 116 L 188 208 Q 160 178 128 124 Z" />)}
      <Seam ctx={ctx} d="M 200 198 L 200 438" o={0.35} />
      {[236, 282, 328, 374].map((y) => (
        <circle key={y} cx={204} cy={y} r={2.4} fill={ctx.dark} fillOpacity={0.6} />
      ))}
      <Seam ctx={ctx} d="M 122 440 L 278 440" o={0.2} />
    </g>
  );
}

function Trunks({ ctx, long }: { ctx: Ctx; long: boolean }) {
  const hem = long ? 410 : 330;
  const outer = long ? 326 : 322;
  const body = `M 96 120 L 304 120 L ${outer} ${hem - 10} L 218 ${hem} L 200 ${long ? 270 : 250} L 182 ${hem} L ${400 - outer} ${hem - 10} Z`;
  const band = "M 96 120 L 304 120 L 302 152 L 98 152 Z";
  if (ctx.view === "back") {
    return (
      <g>
        <Piece ctx={ctx} d={body} />
        <Piece ctx={ctx} d={band} />
        <Seam ctx={ctx} d={`M 200 152 Q 204 200 200 ${long ? 270 : 250}`} o={0.35} />
        <rect x={228} y={178} width={44} height={46} rx={3} fill="none" stroke={ctx.dark} strokeOpacity={0.45} strokeWidth={1.4} />
      </g>
    );
  }
  return (
    <g>
      <Piece ctx={ctx} d={body} />
      <Piece ctx={ctx} d={band} />
      <Seam ctx={ctx} d="M 98 152 L 302 152" o={0.3} />
      <Seam ctx={ctx} d={`M 200 152 L 200 ${long ? 270 : 250}`} o={0.3} />
      <Seam ctx={ctx} d="M 118 164 Q 130 220 124 262" o={0.35} />
      <Seam ctx={ctx} d="M 282 164 Q 270 220 276 262" o={0.35} />
      <path d="M 196 136 Q 180 170 184 196" fill="none" stroke={ctx.light} strokeWidth={3} strokeLinecap="round" />
      <path d="M 204 136 Q 220 170 216 196" fill="none" stroke={ctx.light} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

function renderKind(kind: ArtKind, ctx: Ctx): ReactNode {
  switch (kind) {
    case "triangleTop":
      return <TriangleTop ctx={ctx} />;
    case "bandeauTop":
      return <BandeauTop ctx={ctx} />;
    case "bikiniBottom":
      return <BikiniBottom ctx={ctx} />;
    case "bikiniSet":
      return (
        <g>
          <g transform="translate(36 -20) scale(.82)">
            <TriangleTop ctx={ctx} />
          </g>
          <g transform="translate(60 120) scale(.7)">
            <BikiniBottom ctx={ctx} />
          </g>
        </g>
      );
    case "onePieceFront":
      return <OnePiece ctx={ctx} openBack={false} />;
    case "onePieceOpenBack":
      return <OnePiece ctx={ctx} openBack />;
    case "kaftan":
      return <Kaftan ctx={ctx} />;
    case "cubanShirt":
      return <CubanShirt ctx={ctx} />;
    case "trunks":
      return <Trunks ctx={ctx} long={false} />;
    case "bermuda":
      return <Trunks ctx={ctx} long />;
    case "cubanSet":
      return (
        <g>
          <g transform="translate(48 0) scale(.76)">
            <CubanShirt ctx={ctx} />
          </g>
          <g transform="translate(100 290) scale(.5)">
            <Trunks ctx={ctx} long />
          </g>
        </g>
      );
  }
}

function Defs({ ctx, plate }: { ctx: Ctx; plate: (typeof PLATES)[number] }) {
  const { uid } = ctx;
  return (
    <defs>
      <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="0.35">
        <stop offset="0" stopColor={ctx.light} />
        <stop offset="0.5" stopColor={ctx.base} />
        <stop offset="1" stopColor={ctx.dark} />
      </linearGradient>
      <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={plate.a} />
        <stop offset="1" stopColor={plate.b} />
      </linearGradient>
      <filter id={`${uid}-sh`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#1B365D" floodOpacity="0.22" />
      </filter>
      {ctx.finish === "rib" && (
        <pattern id={`${uid}-f`} width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="2.2" height="5" fill="#000" opacity="0.12" />
          <rect x="2.4" width="0.8" height="5" fill="#fff" opacity="0.16" />
        </pattern>
      )}
      {ctx.finish === "stripe" && (
        <pattern id={`${uid}-f`} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="5" height="16" fill="#fff" opacity="0.26" />
          <rect x="5" width="1" height="16" fill="#000" opacity="0.08" />
        </pattern>
      )}
      {ctx.finish === "linen" && (
        <pattern id={`${uid}-f`} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 .5H6M.5 0V6" stroke="#fff" strokeWidth=".6" opacity="0.22" />
          <path d="M0 3.5H6M3.5 0V6" stroke="#000" strokeWidth=".5" opacity="0.07" />
        </pattern>
      )}
      {ctx.finish === "satin" && (
        <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
      )}
    </defs>
  );
}

function compose(kinds: ArtKind[], ctx: Ctx): ReactNode {
  if (kinds.length === 1) return renderKind(kinds[0], ctx);
  const s = 0.68;
  const ty = 76;
  return (
    <g>
      <g transform={`translate(${115 - 200 * s} ${ty}) scale(${s})`}>{renderKind(kinds[0], ctx)}</g>
      <g transform={`translate(${285 - 200 * s} ${ty}) scale(${s})`}>
        {renderKind(kinds[1], { ...ctx, base: darken(ctx.base, 0.04), light: lighten(ctx.light, 0.04) })}
      </g>
    </g>
  );
}

const VIEWBOX: Record<ArtView, string> = {
  front: "0 0 400 500",
  back: "0 0 400 500",
  detail: "104 128 192 240",
  fabric: "140 190 120 150",
};

export default function ProductArt({
  kinds,
  color,
  finish,
  view,
  uid,
  tone = 0,
  title,
}: {
  kinds: ArtKind[];
  color: string;
  finish: Finish;
  view: ArtView;
  uid: string;
  tone?: number;
  title?: string;
}) {
  const dark = luminance(color) > 0.7;
  const plate = dark ? DARK_PLATES[tone % DARK_PLATES.length] : PLATES[tone % PLATES.length];
  const garmentView: "front" | "back" = view === "back" ? "back" : "front";
  const ctx: Ctx = {
    uid,
    base: color,
    light: lighten(color, 0.16),
    dark: darken(color, 0.22),
    gold: GOLD,
    finish,
    view: garmentView,
  };

  return (
    <svg
      viewBox={VIEWBOX[view]}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={title}
      className="art"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Defs ctx={ctx} plate={plate} />
      <rect width="400" height="500" fill={`url(#${uid}-bg)`} />
      {view === "fabric" ? (
        <g>
          <rect x="120" y="170" width="170" height="190" fill={`url(#${uid}-g)`} />
          {finish !== "solid" && (
            <rect x="120" y="170" width="170" height="190" fill={`url(#${uid}-f)`} transform="rotate(0)" />
          )}
        </g>
      ) : (
        <>
          <path
            d="M 58 500 L 58 210 Q 58 66 200 66 Q 342 66 342 210 L 342 500 Z"
            fill={plate.arch}
            opacity={view === "detail" ? 0.4 : 0.75}
          />
          <circle cx="292" cy="132" r="26" fill={mix(GOLD, "#ffffff", 0.35)} opacity={0.55} />
          {view !== "detail" && <ellipse cx="200" cy="476" rx="118" ry="9" fill="#1B365D" opacity="0.1" />}
          <g filter={`url(#${uid}-sh)`}>{compose(kinds, ctx)}</g>
        </>
      )}
    </svg>
  );
}
