import type { Colorway, Gender, ModelRef, Product, SizeSelector, StyleKey } from "./types";

export const WOMEN_SIZES = ["XS", "S", "M", "L", "XL"];
export const MEN_SIZES = ["S", "M", "L", "XL", "XXL"];

const womenSize: SizeSelector = { key: "size", label: "Size", options: WOMEN_SIZES };
const menSize: SizeSelector = { key: "size", label: "Size", options: MEN_SIZES };
const herSize: SizeSelector = { key: "her", label: "Her size", options: WOMEN_SIZES };
const hisSize: SizeSelector = { key: "his", label: "His size", options: MEN_SIZES };

const herModel: ModelRef = { label: "Her", heightCm: 176, weightKg: 56, wears: "S" };
const hisModel: ModelRef = { label: "Him", heightCm: 188, weightKg: 79, wears: "M" };

const C = {
  sand: { name: "Dune", hex: "#D9C3A0" },
  marine: { name: "Deep Marine", hex: "#1B365D" },
  terracotta: { name: "Terracotta", hex: "#B5654A" },
  ivory: { name: "Ivory", hex: "#F1EBDD" },
  gold: { name: "Gold Hour", hex: "#C5A059" },
  sage: { name: "Sea Sage", hex: "#8C9A83" },
  black: { name: "Noir", hex: "#1E1E1E" },
  sky: { name: "Lagoon", hex: "#8FB3C9" },
  clay: { name: "Clay Rose", hex: "#C9968A" },
} satisfies Record<string, Colorway>;

const SWIM_CARE = [
  "Rinse in cool fresh water after sea, pool and sunscreen.",
  "Hand wash cold with mild soap. Do not wring or tumble dry.",
  "Dry flat in the shade. Avoid hot tubs and rough surfaces.",
];
const LINEN_CARE = [
  "Machine wash cold on a gentle cycle with like colours.",
  "Wash inside out. Do not bleach. Tumble dry low or line dry.",
  "Warm iron while slightly damp for a crisp finish; relaxed creasing is part of linen's charm.",
];

export const products: Product[] = [
  {
    slug: "calista-triangle-bikini-top",
    name: "Calista Triangle Bikini Top",
    gender: "women",
    style: "bikini-top",
    price: 68,
    tagline: "The sliding triangle, in a sculpting rib.",
    description:
      "A clean triangle top with adjustable halter and back ties and removable soft cups. Cut from a matte, quick-dry rib with a gold-tone ring at the centre.",
    details: [
      "Adjustable halter and back ties",
      "Removable soft cups",
      "Polished gold-tone centre ring",
      "Fully lined; quick-drying rib",
      "Mix and match with Calista bottoms (sold separately)",
    ],
    care: SWIM_CARE,
    colors: [C.ivory, C.marine, C.terracotta, C.sand],
    selectors: [womenSize],
    charts: ["womenTop"],
    models: [herModel],
    art: ["triangleTop"],
    finish: "rib",
    hygiene: false,
    bestseller: true,
    brand: "CLACK",
    tags: ["街舞"],
    lookWith: ["calista-low-rise-bikini-bottom", "lido-linen-kaftan", "havana-cuban-collar-shirt"],
  },
  {
    slug: "calista-low-rise-bikini-bottom",
    name: "Calista Low-Rise Bikini Bottom",
    gender: "women",
    style: "bikini-bottom",
    price: 62,
    tagline: "Low-rise, tie-side, endlessly mixable.",
    description:
      "A low-rise tie-side bottom with moderate coverage. Sold separately so you can size your top and bottom independently.",
    details: [
      "Low-rise, moderate coverage",
      "Adjustable tie sides with gold-tone rings",
      "Fully lined with a hygienic liner",
      "Fully lined; quick-drying rib",
    ],
    care: SWIM_CARE,
    colors: [C.ivory, C.marine, C.terracotta, C.sand],
    selectors: [womenSize],
    charts: ["womenBottom"],
    models: [herModel],
    art: ["bikiniBottom"],
    finish: "rib",
    hygiene: true,
    bestseller: true,
    lookWith: ["calista-triangle-bikini-top", "lido-linen-kaftan"],
  },
  {
    slug: "marisol-bandeau-bikini-top",
    name: "Marisol Bandeau Bikini Top",
    gender: "women",
    style: "bikini-top",
    price: 72,
    tagline: "A twisted bandeau for strap-free tans.",
    description:
      "A softly structured bandeau with a centre twist and silicone grip at the inner edge. Includes a removable halter strap for extra support.",
    details: [
      "Centre twist detail",
      "Silicone grip at inner edge",
      "Removable halter strap",
      "Removable soft cups",
    ],
    care: SWIM_CARE,
    colors: [C.gold, C.black, C.sage],
    selectors: [womenSize],
    charts: ["womenTop"],
    models: [herModel],
    art: ["bandeauTop"],
    finish: "satin",
    hygiene: false,
    isNew: true,
    lookWith: ["marisol-high-leg-bikini-bottom", "lido-linen-kaftan"],
  },
  {
    slug: "marisol-high-leg-bikini-bottom",
    name: "Marisol High-Leg Bikini Bottom",
    gender: "women",
    style: "bikini-bottom",
    price: 66,
    tagline: "High-leg line, flattering coverage.",
    description:
      "A high-leg, mid-rise bottom that lengthens the line of the leg. Fully lined with a hygienic liner and a soft inner waistband.",
    details: [
      "High-leg, mid-rise",
      "Moderate coverage at the back",
      "Soft inner waistband",
      "Fully lined with a hygienic liner",
    ],
    care: SWIM_CARE,
    colors: [C.gold, C.black, C.sage],
    selectors: [womenSize],
    charts: ["womenBottom"],
    models: [herModel],
    art: ["bikiniBottom"],
    finish: "satin",
    hygiene: true,
    isNew: true,
    lookWith: ["marisol-bandeau-bikini-top", "lido-linen-kaftan"],
  },
  {
    slug: "amalfi-plunge-one-piece",
    name: "Amalfi Plunge One-Piece",
    gender: "women",
    style: "one-piece",
    price: 138,
    tagline: "The plunge maillot that goes from sea to supper.",
    description:
      "A sculpting plunge one-piece with a defined waist and a high-cut leg. Double-lined through the bust and tummy for a smooth, supportive fit.",
    details: [
      "Plunging V-neckline, wide shoulder straps",
      "Double-lined front panel",
      "High-cut leg, moderate back coverage",
      "Gold-tone centre ring",
      "Fully lined with a hygienic liner",
    ],
    care: SWIM_CARE,
    colors: [C.marine, C.ivory, C.terracotta, C.black],
    selectors: [womenSize],
    charts: ["womenOnePiece"],
    models: [herModel],
    art: ["onePieceFront"],
    finish: "solid",
    hygiene: true,
    bestseller: true,
    lookWith: ["lido-linen-kaftan", "havana-cuban-collar-shirt", "amalfi-couples-set"],
  },
  {
    slug: "portofino-open-back-one-piece",
    name: "Portofino Open-Back One-Piece",
    gender: "women",
    style: "one-piece",
    price: 148,
    compareAt: 168,
    tagline: "A scooped open back, a sunset-worthy exit.",
    description:
      "A high-neck one-piece with a deep scooped back and a hidden bust support panel. Dressy enough for the beach club, easy enough for the water.",
    details: [
      "High neckline with a deep scooped back",
      "Hidden bust support panel",
      "Medium front coverage, low back",
      "Fully lined with a hygienic liner",
    ],
    care: SWIM_CARE,
    colors: [C.gold, C.black, C.sky],
    selectors: [womenSize],
    charts: ["womenOnePiece"],
    models: [herModel],
    art: ["onePieceOpenBack"],
    finish: "satin",
    hygiene: true,
    bestseller: true,
    lookWith: ["lido-linen-kaftan", "calista-triangle-bikini-top"],
  },
  {
    slug: "lido-linen-kaftan",
    name: "Lido Linen Kaftan",
    gender: "women",
    style: "cover-up",
    price: 128,
    tagline: "A breezy kaftan in washed European linen.",
    description:
      "An easy, floor-grazing-in-spirit kaftan in washed linen, with a deep V, a side-tie waist and generous sleeves. Worn over swim or on its own.",
    details: [
      "Washed linen, relaxed fit",
      "Deep V-neck with side-tie waist",
      "Side seam pockets",
      "One relaxed fit; choose your usual size",
    ],
    care: LINEN_CARE,
    colors: [C.ivory, C.sage, C.clay],
    selectors: [womenSize],
    charts: ["womenDress"],
    models: [herModel],
    art: ["kaftan"],
    finish: "linen",
    hygiene: false,
    bestseller: true,
    lookWith: ["amalfi-plunge-one-piece", "calista-triangle-bikini-top", "calista-low-rise-bikini-bottom"],
  },
  {
    slug: "havana-cuban-collar-shirt",
    name: "Havana Cuban Collar Shirt",
    gender: "men",
    style: "cuban-shirt",
    price: 98,
    tagline: "The camp-collar shirt, in a washed linen blend.",
    description:
      "A relaxed Cuban collar shirt in a washed linen-viscose blend with a soft drape. Worn open over the pool or buttoned up for dinner.",
    details: [
      "Open camp (Cuban) collar",
      "Short sleeves, straight hem",
      "Corozo-style buttons",
      "Relaxed fit; size down for a closer cut",
    ],
    care: LINEN_CARE,
    colors: [C.ivory, C.marine, C.sage, C.terracotta],
    selectors: [menSize],
    charts: ["menShirt"],
    models: [hisModel],
    art: ["cubanShirt"],
    finish: "linen",
    hygiene: false,
    bestseller: true,
    brand: "Havana Dept",
    tags: ["滑板"],
    lookWith: ["havana-linen-shorts", "capri-tailored-swim-trunks", "havana-cuban-collar-set"],
  },
  {
    slug: "havana-linen-shorts",
    name: "Havana Linen Drawstring Shorts",
    gender: "men",
    style: "shorts",
    price: 84,
    tagline: "Mid-length shorts that match the Havana shirt.",
    description:
      "Mid-length pull-on shorts in the same washed linen blend as the Havana shirt, with an elasticated drawstring waist and deep pockets.",
    details: [
      "Elasticated drawstring waist",
      "Mid-length, 7 inch inseam",
      "Two side pockets and one back pocket",
    ],
    care: LINEN_CARE,
    colors: [C.ivory, C.marine, C.sage, C.terracotta],
    selectors: [menSize],
    charts: ["menBottom"],
    models: [hisModel],
    art: ["bermuda"],
    finish: "linen",
    hygiene: false,
    lookWith: ["havana-cuban-collar-shirt", "havana-cuban-collar-set"],
  },
  {
    slug: "havana-cuban-collar-set",
    name: "Havana Cuban Collar Set",
    gender: "men",
    style: "cuban-set",
    price: 168,
    compareAt: 182,
    tagline: "The matching shirt and shorts set.",
    description:
      "Our Havana Cuban collar shirt and drawstring shorts, together. The resort uniform for hot afternoons, set at a better price than buying the pieces separately.",
    details: [
      "Includes Havana Cuban Collar Shirt and Havana Linen Drawstring Shorts",
      "Washed linen-viscose blend",
      "Relaxed fit; order the same size for both pieces",
    ],
    care: LINEN_CARE,
    colors: [C.ivory, C.marine, C.sage, C.terracotta],
    selectors: [menSize],
    charts: ["menShirt", "menBottom"],
    models: [hisModel],
    art: ["cubanSet"],
    finish: "linen",
    hygiene: false,
    bestseller: true,
    lookWith: ["havana-cuban-collar-shirt", "capri-tailored-swim-trunks"],
  },
  {
    slug: "positano-striped-cuban-shirt",
    name: "Positano Striped Cuban Shirt",
    gender: "men",
    style: "cuban-shirt",
    price: 104,
    tagline: "Tonal vertical stripes in a cooling weave.",
    description:
      "A cotton-blend Cuban collar shirt with a fine tonal stripe and a slightly longer, cropped-boxy body. Cut to be worn untucked.",
    details: [
      "Open camp (Cuban) collar",
      "Fine tonal vertical stripe",
      "Boxy fit, side vents",
      "Cotton-blend, lightweight weave",
    ],
    care: LINEN_CARE,
    colors: [C.sky, C.sand, C.clay],
    selectors: [menSize],
    charts: ["menShirt"],
    models: [hisModel],
    art: ["cubanShirt"],
    finish: "stripe",
    hygiene: false,
    isNew: true,
    lookWith: ["sorrento-linen-bermuda", "capri-tailored-swim-trunks"],
  },
  {
    slug: "capri-tailored-swim-trunks",
    name: "Capri Tailored Swim Trunks",
    gender: "men",
    style: "swim-trunks",
    price: 78,
    tagline: "Tailored, quick-dry, mid-thigh.",
    description:
      "Tailored swim trunks with a flat-front waist and a mesh-free lining so there is nothing to chafe. Quick-drying recycled-blend fabric with a soft matte hand.",
    details: [
      "Mid-thigh, 6.5 inch inseam",
      "Elasticated waist with drawstring",
      "Mesh-free, soft inner lining",
      "Side pockets and back pocket with a hook-and-loop closure",
    ],
    care: SWIM_CARE,
    colors: [C.marine, C.sand, C.terracotta, C.black],
    selectors: [menSize],
    charts: ["menBottom"],
    models: [hisModel],
    art: ["trunks"],
    finish: "solid",
    hygiene: false,
    bestseller: true,
    lookWith: ["havana-cuban-collar-shirt", "positano-striped-cuban-shirt"],
  },
  {
    slug: "sorrento-linen-bermuda",
    name: "Sorrento Linen Bermuda",
    gender: "men",
    style: "shorts",
    price: 92,
    tagline: "Longer, sharper, still easy.",
    description:
      "A relaxed Bermuda cut in washed linen with a flat front and an easy hook-and-bar waist. Longer than our Havana shorts, with a clean tailored finish.",
    details: [
      "Flat-front tailored waist",
      "Longer 9 inch inseam",
      "Two side pockets and one back welt pocket",
    ],
    care: LINEN_CARE,
    colors: [C.sand, C.sage, C.black],
    selectors: [menSize],
    charts: ["menBottom"],
    models: [hisModel],
    art: ["bermuda"],
    finish: "linen",
    hygiene: false,
    lookWith: ["positano-striped-cuban-shirt", "havana-cuban-collar-shirt"],
  },
  {
    slug: "amalfi-couples-set",
    name: "The Amalfi Couples Set",
    gender: "couples",
    style: "couples-set",
    price: 218,
    compareAt: 236,
    tagline: "Her plunge one-piece. His Cuban collar shirt.",
    description:
      "Matching in spirit, not in print. The Amalfi plunge one-piece and the Havana Cuban collar shirt, in a shared colour and a shared price.",
    details: [
      "Includes Amalfi Plunge One-Piece and Havana Cuban Collar Shirt",
      "Choose each size independently",
      "Her piece is fully lined with a hygienic liner",
    ],
    care: [...SWIM_CARE, "Wash linen pieces separately from swimwear."],
    colors: [C.marine, C.ivory, C.terracotta],
    selectors: [herSize, hisSize],
    charts: ["womenOnePiece", "menShirt"],
    models: [herModel, hisModel],
    art: ["onePieceFront", "cubanShirt"],
    finish: "solid",
    hygiene: true,
    bestseller: true,
    lookWith: ["lido-linen-kaftan", "capri-tailored-swim-trunks"],
  },
  {
    slug: "capri-couples-set",
    name: "The Capri Couples Set",
    gender: "couples",
    style: "couples-set",
    price: 168,
    compareAt: 208,
    tagline: "Calista bikini. Capri trunks.",
    description:
      "The Calista triangle top and low-rise bottom with the Capri tailored swim trunks, in one shared colourway.",
    details: [
      "Includes Calista bikini top and bottom plus Capri trunks",
      "Choose each size independently",
      "Bikini bottom has a hygienic liner",
    ],
    care: SWIM_CARE,
    colors: [C.marine, C.terracotta, C.sand],
    selectors: [herSize, hisSize],
    charts: ["womenTop", "womenBottom", "menBottom"],
    models: [herModel, hisModel],
    art: ["bikiniSet", "trunks"],
    finish: "rib",
    hygiene: true,
    isNew: true,
    lookWith: ["lido-linen-kaftan", "havana-cuban-collar-shirt"],
  },
  {
    slug: "positano-linen-couples-set",
    name: "The Positano Linen Couples Set",
    gender: "couples",
    style: "couples-set",
    price: 208,
    compareAt: 226,
    tagline: "Her kaftan. His camp-collar shirt.",
    description:
      "Our Lido linen kaftan and Havana Cuban collar shirt in the same washed linen: effortless for the beach club and the long lunch after.",
    details: [
      "Includes Lido Linen Kaftan and Havana Cuban Collar Shirt",
      "Choose each size independently",
    ],
    care: LINEN_CARE,
    colors: [C.ivory, C.sage, C.clay],
    selectors: [herSize, hisSize],
    charts: ["womenDress", "menShirt"],
    models: [herModel, hisModel],
    art: ["kaftan", "cubanShirt"],
    finish: "linen",
    hygiene: false,
    lookWith: ["calista-triangle-bikini-top", "capri-tailored-swim-trunks"],
  },
];

export const STYLE_LABELS: Record<StyleKey, string> = {
  "bikini-top": "Bikini Top",
  "bikini-bottom": "Bikini Bottom",
  "one-piece": "One-Piece",
  "cover-up": "Cover-Up",
  "cuban-shirt": "Cuban Collar Shirt",
  "cuban-set": "Cuban Collar Set",
  "swim-trunks": "Swim Trunks",
  shorts: "Shorts",
  "couples-set": "Couples Set",
};

export const GENDER_LABELS: Record<Gender, string> = {
  women: "Women",
  men: "Men",
  couples: "Couples Sets",
};

export const COLLECTIONS: Record<string, { title: string; eyebrow: string; blurb: string; gender?: Gender }> = {
  all: {
    title: "全部 The Collection",
    eyebrow: "SELECT SHOP",
    blurb: "街舞與滑板圈真的會穿的。Picked for the streets.",
  },
  women: {
    title: "女裝 Women",
    eyebrow: "Shop Women",
    blurb: "女裝選品。Separates, one-pieces, and pieces that move.",
    gender: "women",
  },
  men: {
    title: "男裝 Men",
    eyebrow: "Shop Men",
    blurb: "男裝選品。Shirts, shorts, and session-ready cuts.",
    gender: "men",
  },
  couples: {
    title: "雙人 Couples Sets",
    eyebrow: "Shop Couples",
    blurb: "兩個人一起穿。Pieces for two, priced together.",
    gender: "couples",
  },
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

export function validateSelection(
  p: Product,
  colorName: string,
  sizes: Record<string, string>
): boolean {
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
