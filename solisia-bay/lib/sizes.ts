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
  women: {
    title: "Women",
    note: "Body measurements. If you are between sizes, choose the larger size.",
    columns: ["Bust", "Waist", "Hip"],
    rows: [
      { size: "XS", values: [r(78, 82), r(60, 64), r(86, 90)] },
      { size: "S", values: [r(82, 86), r(64, 68), r(90, 94)] },
      { size: "M", values: [r(86, 90), r(68, 72), r(94, 98)] },
      { size: "L", values: [r(90, 96), r(72, 78), r(98, 104)] },
      { size: "XL", values: [r(96, 102), r(78, 84), r(104, 110)] },
    ],
  },
  men: {
    title: "Men",
    note: "Body measurements. If you are between sizes, choose the larger size.",
    columns: ["Chest", "Waist", "Hip"],
    rows: [
      { size: "S", values: [r(88, 94), r(74, 80), r(90, 96)] },
      { size: "M", values: [r(94, 100), r(80, 86), r(96, 102)] },
      { size: "L", values: [r(100, 106), r(86, 92), r(102, 108)] },
      { size: "XL", values: [r(106, 114), r(92, 100), r(108, 116)] },
      { size: "XXL", values: [r(114, 122), r(100, 108), r(116, 124)] },
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
