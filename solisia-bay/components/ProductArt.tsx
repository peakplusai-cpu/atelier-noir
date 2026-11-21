import type { ReactNode } from "react";
import type { ArtKind, Finish } from "@/lib/types";
import { darken, lighten } from "@/lib/color";

export type ArtView = "front" | "back" | "detail" | "fabric";

type Ctx = { uid: string; base: string; dark: string; light: string; finish: Finish };

const PLATES = [
  { a: "#F7F7F7", b: "#ECECEC" },
  { a: "#F3F3F3", b: "#E4E4E4" },
];

function Piece({ d, ctx }: { d: string; ctx: Ctx }) {
  return (
    <>
      <path d={d} fill={`url(#${ctx.uid}-g)`} />
      {ctx.finish !== "solid" && <path d={d} fill={`url(#${ctx.uid}-f)`} />}
    </>
  );
}

const SHAPES: Record<ArtKind, string> = {
  tee: "M 150 120 L 118 150 L 70 140 L 96 190 L 124 176 L 124 340 L 276 340 L 276 176 L 304 190 L 330 140 L 282 150 L 250 120 Q 200 146 150 120 Z",
  shirt: "M 150 112 L 116 148 L 64 136 L 92 196 L 124 174 L 124 348 L 276 348 L 276 174 L 308 196 L 336 136 L 284 148 L 250 112 Q 200 150 150 112 Z",
  hoodie: "M 156 108 Q 200 78 244 108 L 250 128 L 286 150 L 332 140 L 304 196 L 276 176 L 276 344 L 124 344 L 124 176 L 96 196 L 68 140 L 114 150 L 150 128 Z",
  jacket: "M 148 118 L 112 154 L 62 142 L 94 200 L 128 178 L 128 352 L 188 352 L 188 210 L 212 210 L 212 352 L 272 352 L 272 178 L 306 200 L 338 142 L 288 154 L 252 118 Q 200 148 148 118 Z",
  pants: "M 132 150 L 132 430 L 186 430 L 194 250 L 206 250 L 214 430 L 268 430 L 268 150 Z",
  shorts: "M 132 168 L 128 300 L 186 300 L 194 230 L 206 230 L 214 300 L 272 300 L 268 168 Z",
  accessory: "M 120 210 Q 120 150 200 150 Q 280 150 280 210 L 268 228 L 132 228 Z",
};

function renderKind(kind: string, ctx: Ctx): ReactNode {
  const d = SHAPES[kind as ArtKind] ?? SHAPES.tee;
  return <Piece d={d} ctx={ctx} />;
}

const VIEWBOX: Record<ArtView, string> = {
  front: "40 70 320 340",
  back: "40 70 320 340",
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
  const plate = PLATES[tone % PLATES.length];
  const ctx: Ctx = { uid, base: color, light: lighten(color, 0.16), dark: darken(color, 0.22), finish };
  return (
    <svg viewBox={VIEWBOX[view]} preserveAspectRatio="xMidYMid meet" role="img" aria-label={title} className="art" xmlns="http://www.w3.org/2000/svg">
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
        {finish !== "solid" && (
          <pattern id={`${uid}-f`} width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 .5H6M.5 0V6" stroke="#000" strokeWidth=".5" opacity="0.12" />
          </pattern>
        )}
      </defs>
      <rect width="400" height="500" fill={`url(#${uid}-bg)`} />
      {view === "fabric" ? (
        <rect x="120" y="170" width="170" height="190" fill={`url(#${uid}-g)`} />
      ) : (
        renderKind(kinds[0] ?? "tee", ctx)
      )}
    </svg>
  );
}
