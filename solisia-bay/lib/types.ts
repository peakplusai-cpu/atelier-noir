export type Gender = "women" | "men" | "couples";

export type StyleKey =
  | "bikini-top"
  | "bikini-bottom"
  | "one-piece"
  | "cover-up"
  | "cuban-shirt"
  | "cuban-set"
  | "swim-trunks"
  | "shorts"
  | "couples-set";

export type ArtKind =
  | "triangleTop"
  | "bandeauTop"
  | "bikiniBottom"
  | "bikiniSet"
  | "onePieceFront"
  | "onePieceOpenBack"
  | "kaftan"
  | "cubanShirt"
  | "trunks"
  | "bermuda"
  | "cubanSet";

export type Finish = "solid" | "rib" | "stripe" | "linen" | "satin";

export type Colorway = { name: string; hex: string };

export type SizeSelector = { key: string; label: string; options: string[] };

export type ChartKey =
  | "womenTop"
  | "womenBottom"
  | "womenOnePiece"
  | "womenDress"
  | "menShirt"
  | "menBottom";

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
  hygiene: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  lookWith: string[];
  media?: { front?: string; back?: string; gallery?: string[]; video?: string };
  /** published is visible on the storefront. Draft is staff-only. */
  status?: "published" | "draft";
  /** Units left, keyed by `color|size label`. Missing inventory means the piece is not stock-tracked. */
  inventory?: Record<string, number>;
  /** Optional select-shop label, for example the label we picked the piece from. */
  brand?: string;
  /** Optional culture tags such as 滑板 or 街舞. */
  tags?: string[];
};
