import type { Colorway, Gender, ModelRef, Product, SizeSelector, StyleKey } from "./types";

export const WOMEN_SIZES = ["XS", "S", "M", "L", "XL"];
export const MEN_SIZES = ["S", "M", "L", "XL", "XXL"];

const womenSize: SizeSelector = { key: "size", label: "Size", options: WOMEN_SIZES };
const menSize: SizeSelector = { key: "size", label: "Size", options: MEN_SIZES };
const model: ModelRef = { label: "Model", heightCm: 176, weightKg: 62, wears: "M" };

const C = {
  black: { name: "Black", hex: "#111111" },
  white: { name: "White", hex: "#F4F4F4" },
  grey: { name: "Grey", hex: "#8A8A8A" },
  navy: { name: "Navy", hex: "#1C2430" },
} satisfies Record<string, Colorway>;

const CARE = [
  "Machine wash cold with like colours.",
  "Do not bleach. Tumble dry low or hang dry.",
  "Iron on low if needed.",
];

function piece(input: Omit<Product, "care" | "selectors" | "charts" | "models" | "finish" | "tagline"> & { finish?: Product["finish"] }): Product {
  return {
    care: CARE,
    selectors: [input.gender === "men" ? menSize : womenSize],
    charts: [input.gender === "men" ? "men" : "women"],
    models: [{ ...model, wears: input.gender === "men" ? "M" : "S" }],
    finish: input.finish ?? "solid",
    tagline: "",
    ...input,
  };
}

export const products: Product[] = [
  piece({
    slug: "clack-box-tee",
    name: "Box Tee",
    gender: "women",
    style: "tee",
    price: 68,
    description: "A heavy cotton box tee with a rib collar and a straight hem.",
    details: ["Heavy cotton jersey", "Rib collar", "Straight hem"],
    colors: [C.black, C.white],
    art: ["tee"],
    bestseller: true,
    brand: "CLACK",
    tags: ["街舞"],
    lookWith: ["clack-straight-pants"],
  }),
  piece({
    slug: "clack-oxford-shirt",
    name: "Oxford Shirt",
    gender: "men",
    style: "shirt",
    price: 62,
    description: "A cotton oxford shirt with a button front and a standard collar.",
    details: ["Cotton oxford", "Button front", "Standard collar"],
    colors: [C.white, C.navy],
    art: ["shirt"],
    bestseller: true,
    brand: "CLACK",
    tags: ["滑板"],
    lookWith: ["clack-chino-shorts"],
  }),
  piece({
    slug: "clack-hoodie",
    name: "Hoodie",
    gender: "women",
    style: "hoodie",
    price: 98,
    description: "A fleece hoodie with a kangaroo pocket and rib cuffs.",
    details: ["Fleece", "Kangaroo pocket", "Rib cuffs and hem"],
    colors: [C.black, C.grey],
    art: ["hoodie"],
    lookWith: ["clack-box-tee"],
  }),
  piece({
    slug: "clack-work-jacket",
    name: "Work Jacket",
    gender: "men",
    style: "jacket",
    price: 148,
    description: "A cotton work jacket with a zip front and two lower pockets.",
    details: ["Cotton canvas", "Zip front", "Two lower pockets"],
    colors: [C.navy, C.black],
    art: ["jacket"],
    lookWith: ["clack-oxford-shirt"],
  }),
  piece({
    slug: "clack-straight-pants",
    name: "Straight Pants",
    gender: "women",
    style: "pants",
    price: 118,
    description: "Straight-leg pants with a flat front and side pockets.",
    details: ["Straight leg", "Flat front", "Side pockets"],
    colors: [C.black, C.grey],
    art: ["pants"],
    lookWith: ["clack-box-tee"],
  }),
  piece({
    slug: "clack-chino-shorts",
    name: "Chino Shorts",
    gender: "men",
    style: "shorts",
    price: 78,
    description: "Cotton chino shorts cut above the knee.",
    details: ["Cotton twill", "Above the knee", "Side pockets"],
    colors: [C.navy, C.grey],
    art: ["shorts"],
    lookWith: ["clack-oxford-shirt"],
  }),
  piece({
    slug: "clack-cap",
    name: "Cap",
    gender: "men",
    style: "accessory",
    price: 36,
    description: "A cotton cap with an adjustable back.",
    details: ["Cotton twill", "Adjustable back"],
    colors: [C.black, C.white],
    art: ["accessory"],
    lookWith: ["clack-box-tee"],
  }),
];

export const STYLE_LABELS: Record<StyleKey, string> = {
  tee: "T-shirt",
  shirt: "Shirt",
  hoodie: "Hoodie",
  jacket: "Jacket",
  pants: "Pants",
  shorts: "Shorts",
  accessory: "Accessories",
};

export function styleLabel(style: string): string {
  return STYLE_LABELS[style as StyleKey] ?? "Apparel";
}

export const GENDER_LABELS: Record<Gender, string> = {
  women: "Women",
  men: "Men",
};

export const COLLECTIONS: Record<string, { title: string; gender?: Gender }> = {
  all: { title: "全部" },
  women: { title: "女裝 Women", gender: "women" },
  men: { title: "男裝 Men", gender: "men" },
};

export function productBrand(product: Product): string {
  return typeof product.brand === "string" ? product.brand.trim().slice(0, 40) : "";
}

export function productTags(product: Product): string[] {
  if (!Array.isArray(product.tags)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const tag of product.tags) {
    if (typeof tag !== "string") continue;
    const clean = tag.trim().slice(0, 24);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    tags.push(clean);
    if (tags.length >= 6) break;
  }
  return tags;
}

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function productsFor(handle: string, source: Product[] = products): Product[] {
  const gender = COLLECTIONS[handle]?.gender;
  return gender ? source.filter((p) => p.gender === gender) : source;
}

export function bestsellers(limit = 8, source: Product[] = products): Product[] {
  const picked = source.filter((p) => p.bestseller);
  return (picked.length ? picked : source).slice(0, limit);
}

export function productSizes(p: Product): string[] {
  const set = new Set<string>();
  for (const s of p.selectors) for (const o of s.options) set.add(o);
  return Array.from(set);
}

export function sizeLabel(p: Product, sizes: Record<string, string>): string {
  if (p.selectors.length === 1) return sizes[p.selectors[0].key] ?? "";
  return p.selectors.map((s) => `${s.label.replace(" size", "")} ${sizes[s.key] ?? ""}`).join(" / ");
}

export function validateSelection(p: Product, colorName: string, sizes: Record<string, string>): boolean {
  if (!p.colors.some((c) => c.name === colorName)) return false;
  return p.selectors.every((s) => s.options.includes(sizes?.[s.key] ?? ""));
}

export function variantKey(color: string, size: string): string {
  return `${color}|${size}`;
}

export function selectionCombos(p: Product): { sizes: Record<string, string>; label: string }[] {
  let acc: Record<string, string>[] = [{}];
  for (const selector of p.selectors) {
    acc = acc.flatMap((base) => selector.options.map((option) => ({ ...base, [selector.key]: option })));
  }
  return acc.map((sizes) => ({ sizes, label: sizeLabel(p, sizes) }));
}

export function isPublished(p: Product): boolean {
  return (p.status ?? "published") === "published";
}

export function stockOf(p: Product, color: string, size: string): number | null {
  if (!p.inventory) return null;
  return Math.max(0, Math.floor(p.inventory[variantKey(color, size)] ?? 0));
}

export function totalStock(p: Product): number | null {
  if (!p.inventory) return null;
  return Object.values(p.inventory).reduce((sum, qty) => sum + Math.max(0, Math.floor(Number(qty) || 0)), 0);
}
