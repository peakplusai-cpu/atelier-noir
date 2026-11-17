import type { ChartKey } from "./types";

export type Range = [number, number];

export type SizeChart = {
  title: string;
  note: string;
  columns: string[];
  rows: { size: string; values: Range[] }[];
};

const r = (a: number, b: number): Range => [a, b];

export const SIZE_CHARTS: Record<ChartKey, SizeChart> = {
  womenTop: {
    title: "Women's Bikini Top",
    note: "Body measurements. If you are between sizes, size up for comfort or down for support.",
    columns: ["Bust", "Underbust"],
    rows: [
      { size: "XS", values: [r(78, 82), r(63, 67)] },
      { size: "S", values: [r(82, 86), r(67, 71)] },
      { size: "M", values: [r(86, 90), r(71, 75)] },
      { size: "L", values: [r(90, 96), r(75, 81)] },
      { size: "XL", values: [r(96, 102), r(81, 87)] },
    ],
  },
  womenBottom: {
    title: "Women's Bikini Bottom",
    note: "Body measurements. Bottoms are sold separately and can be sized independently from tops.",
    columns: ["Waist", "Hip"],
    rows: [
      { size: "XS", values: [r(60, 64), r(86, 90)] },
      { size: "S", values: [r(64, 68), r(90, 94)] },
      { size: "M", values: [r(68, 72), r(94, 98)] },
      { size: "L", values: [r(72, 78), r(98, 104)] },
      { size: "XL", values: [r(78, 84), r(104, 110)] },
    ],
  },
  womenOnePiece: {
    title: "Women's One-Piece",
    note: "Body measurements. Choose by your fullest measurement; torso length is allowed for in the cut.",
    columns: ["Bust", "Waist", "Hip"],
    rows: [
      { size: "XS", values: [r(78, 82), r(60, 64), r(86, 90)] },
      { size: "S", values: [r(82, 86), r(64, 68), r(90, 94)] },
      { size: "M", values: [r(86, 90), r(68, 72), r(94, 98)] },
      { size: "L", values: [r(90, 96), r(72, 78), r(98, 104)] },
      { size: "XL", values: [r(96, 102), r(78, 84), r(104, 110)] },
    ],
  },
  womenDress: {
    title: "Women's Linen Kaftan",
    note: "Body measurements. Cut with a relaxed, oversized fall; choose your usual size.",
    columns: ["Bust", "Waist", "Hip"],
    rows: [
      { size: "XS", values: [r(78, 82), r(60, 64), r(86, 90)] },
      { size: "S", values: [r(82, 86), r(64, 68), r(90, 94)] },
      { size: "M", values: [r(86, 90), r(68, 72), r(94, 98)] },
      { size: "L", values: [r(90, 96), r(72, 78), r(98, 104)] },
      { size: "XL", values: [r(96, 102), r(78, 84), r(104, 110)] },
    ],
  },
  menShirt: {
    title: "Men's Shirt",
    note: "Body measurements. Our shirts have a relaxed fit; size down for a closer cut.",
    columns: ["Chest", "Waist", "Shoulder"],
    rows: [
      { size: "S", values: [r(92, 98), r(78, 84), r(44, 45)] },
      { size: "M", values: [r(98, 104), r(84, 90), r(46, 47)] },
      { size: "L", values: [r(104, 110), r(90, 96), r(48, 49)] },
      { size: "XL", values: [r(110, 118), r(96, 104), r(50, 51)] },
      { size: "XXL", values: [r(118, 126), r(104, 112), r(52, 53)] },
    ],
  },
  menBottom: {
    title: "Men's Shorts & Trunks",
    note: "Body measurements. Waistbands are elasticated and stretch with you.",
    columns: ["Waist", "Hip"],
    rows: [
      { size: "S", values: [r(76, 81), r(92, 97)] },
      { size: "M", values: [r(81, 86), r(97, 102)] },
      { size: "L", values: [r(86, 92), r(102, 108)] },
      { size: "XL", values: [r(92, 99), r(108, 115)] },
      { size: "XXL", values: [r(99, 107), r(115, 123)] },
    ],
  },
};

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export type Unit = "cm" | "in";

export function formatRange([a, b]: Range, unit: Unit): string {
  if (unit === "cm") return a === b ? `${a}` : `${a}\u2013${b}`;
  const x = Math.round((a / 2.54) * 10) / 10;
  const y = Math.round((b / 2.54) * 10) / 10;
  return x === y ? trim(x) : `${trim(x)}\u2013${trim(y)}`;
}

export function formatHeight(cm: number, unit: Unit): string {
  if (unit === "cm") return `${cm} cm`;
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return inch === 12 ? `${ft + 1}'0"` : `${ft}'${inch}"`;
}

export function formatWeight(kg: number, unit: Unit): string {
  return unit === "cm" ? `${kg} kg` : `${Math.round(kg * 2.20462)} lb`;
}
