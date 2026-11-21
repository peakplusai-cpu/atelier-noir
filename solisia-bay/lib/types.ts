export type Gender = "women" | "men";

export type StyleKey = "tee" | "shirt" | "hoodie" | "jacket" | "pants" | "shorts" | "accessory";

export type ArtKind = StyleKey;

export type Finish = "solid" | "rib" | "stripe" | "linen" | "satin";

export type Colorway = { name: string; hex: string };

export type SizeSelector = { key: string; label: string; options: string[] };

export type ChartKey = "women" | "men";

export type ModelRef = {
  label: string;
  heightCm: number;
  weightKg: number;
  wears: string;
};

export type Product = {
  slug: string;
  name: string;
  gender: Gender;
  style: StyleKey;
  price: number;
  compareAt?: number;
  tagline: string;
  description: string;
  details: string[];
  care: string[];
  colors: Colorway[];
  selectors: SizeSelector[];
  charts: ChartKey[];
  models: ModelRef[];
  art: ArtKind[];
  finish: Finish;
  bestseller?: boolean;
  isNew?: boolean;
  lookWith: string[];
  media?: { front?: string; back?: string; gallery?: string[]; video?: string };
  /** published is visible on the storefront. Draft is staff-only. */
  status?: "published" | "draft";
  /** Units left, keyed by `color|size label`. Missing inventory means the piece is not stock-tracked. */
  inventory?: Record<string, number>;
  /** Optional select-shop label. */
  brand?: string;
  /** Optional tags such as 滑板 or 街舞. */
  tags?: string[];
};
