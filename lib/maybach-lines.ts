export type Stroke = {
  d: string;
  width: number;
  delay: number;
  dur: number;
  opacity?: number;
};

const FRONT = { x: 344, y: 403 };
const REAR = { x: 1218, y: 403 };

function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;
}

function spokes(cx: number, cy: number, count: number, r1: number, r2: number, twist: number): string {
  const parts: string[] = [];
  for (let k = 0; k < count; k += 1) {
    const a = (k / count) * Math.PI * 2;
    const b = a + (twist * Math.PI) / 180;
    const x1 = cx + Math.cos(a) * r1;
    const y1 = cy + Math.sin(a) * r1;
    const x2 = cx + Math.cos(b) * r2;
    const y2 = cy + Math.sin(b) * r2;
    parts.push(`M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`);
  }
  return parts.join(" ");
}

function wheel(cx: number, cy: number): { tire: string; rim: string; spokes: string; hub: string } {
  return {
    tire: `${circle(cx, cy, 97)} ${circle(cx, cy, 84)}`,
    rim: `${circle(cx, cy, 68)} ${circle(cx, cy, 62)}`,
    spokes: spokes(cx, cy, 20, 20, 61, 16),
    hub: `${circle(cx, cy, 15)} ${circle(cx, cy, 5)}`,
  };
}

const wf = wheel(FRONT.x, FRONT.y);
const wr = wheel(REAR.x, REAR.y);

export const BODY =
  "M118 456 C160 462 210 466 254 468 A111 111 0 1 1 434 468 L1128 468 A111 111 0 1 1 1308 468 L1466 468 C1490 468 1500 452 1500 424 L1500 338 C1500 306 1494 284 1474 270 C1440 258 1410 252 1380 250 C1340 232 1296 210 1262 196 C1190 150 1060 112 900 108 C820 106 720 110 650 126 L470 244 C380 256 270 266 200 290 C160 304 130 322 122 352 C114 384 112 424 118 456 Z";

export const STROKES: Stroke[] = [
  { d: BODY, width: 2.8, delay: 0.35, dur: 3.4 },

  {
    d: "M506 254 L650 148 C720 134 820 128 900 130 C1040 132 1150 156 1226 196 L1304 244 C1100 246 800 250 506 256 Z",
    width: 2,
    delay: 2.9,
    dur: 1.5,
  },
  { d: "M900 130 L906 250 L912 468", width: 1.5, delay: 3.5, dur: 1.2 },
  { d: "M1170 166 L1124 354", width: 1.5, delay: 3.7, dur: 1, opacity: 0.9 },
  { d: "M494 256 C498 340 502 410 506 468", width: 1.5, delay: 3.6, dur: 1.2, opacity: 0.9 },

  { d: "M494 262 C800 256 1100 250 1308 244 M502 269 C800 263 1100 257 1304 251", width: 1.2, delay: 3.8, dur: 1.4, opacity: 0.8 },
  { d: "M514 334 C720 324 960 320 1120 328", width: 1.2, delay: 4.0, dur: 1.2, opacity: 0.7 },
  { d: "M520 446 C720 450 960 450 1110 446", width: 1.2, delay: 4.1, dur: 1.1, opacity: 0.7 },
  { d: "M742 274 h58 M1032 270 h58", width: 2.4, delay: 4.3, dur: 0.7 },
  { d: "M528 264 C528 248 548 240 572 242 C590 244 596 256 592 268 Z", width: 1.6, delay: 4.2, dur: 0.8 },

  { d: "M134 338 C180 326 230 318 268 314 L276 324 C236 336 190 348 148 360 Z", width: 1.6, delay: 4.0, dur: 0.9 },
  { d: "M214 300 C300 286 390 272 480 260", width: 1.2, delay: 4.2, dur: 0.9, opacity: 0.7 },
  { d: "M126 404 C170 414 216 422 258 426 M150 436 L236 442", width: 1.2, delay: 4.3, dur: 0.9, opacity: 0.8 },
  { d: "M1470 292 C1484 296 1496 304 1499 318 L1478 322 Z M1380 256 C1420 266 1460 280 1498 292 M1396 446 L1494 440", width: 1.4, delay: 4.2, dur: 1.1, opacity: 0.85 },
  { d: `${circle(1293, 222, 11)} M1287 228 L1287 216 L1293 223 L1299 216 L1299 228`, width: 1.2, delay: 4.7, dur: 0.7 },

  { d: wf.tire, width: 2.4, delay: 3.1, dur: 1.5 },
  { d: wr.tire, width: 2.4, delay: 3.3, dur: 1.5 },
  { d: wf.rim, width: 1.8, delay: 3.9, dur: 1.1 },
  { d: wr.rim, width: 1.8, delay: 4.0, dur: 1.1 },
  { d: wf.spokes, width: 1.2, delay: 4.3, dur: 1.2, opacity: 0.9 },
  { d: wr.spokes, width: 1.2, delay: 4.4, dur: 1.2, opacity: 0.9 },
  { d: wf.hub, width: 1.4, delay: 4.9, dur: 0.5 },
  { d: wr.hub, width: 1.4, delay: 5.0, dur: 0.5 },

  { d: "M40 500 L1560 500", width: 1, delay: 4.6, dur: 1.2, opacity: 0.35 },
];

export const INTRO_TOTAL = 6.9;
