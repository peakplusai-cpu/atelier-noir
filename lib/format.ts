import type { CarStatus } from "./types";

export function formatPrice(n: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMileage(n: number): string {
  return `${new Intl.NumberFormat("zh-TW").format(n)} km`;
}

export function padIndex(n: number): string {
  return String(n).padStart(2, "0");
}

export function statusLabel(status: CarStatus): string {
  if (status === "available") return "可鑑賞";
  if (status === "reserved") return "已預留";
  return "已交付";
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
}
