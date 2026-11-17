import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { randomBytes } from "crypto";
import { products as seedProducts, selectionCombos, variantKey } from "./catalog";
import { withLock } from "./lock";
import { StorageError } from "./orders";
import type { Promotion, WallPost } from "./promos";
import { SITE } from "./site";
import { supabaseAdmin, supabaseConfigured } from "./supabase";
import type { ArtKind, ChartKey, Gender, ModelRef, Product, StyleKey } from "./types";

export type { Promotion, WallPost } from "./promos";

export type ShopSettings = {
  announcement: string;
  freeShippingThreshold: number;
  flatShipping: number;
  email: string;
};

export type ShopData = {
  seeded: boolean;
  settings: ShopSettings;
  products: Product[];
  promotions: Promotion[];
  wall: WallPost[];
};

const TABLE = "solisia_store";
const FILE = process.env.SOLISIA_SHOP_FILE || join(process.cwd(), "data", "shop.json");
export const SEED_STOCK = 24;
export const UPLOAD_BUCKET = "solisia-uploads";

const her: ModelRef = { label: "Her", heightCm: 176, weightKg: 56, wears: "S" };
const him: ModelRef = { label: "Him", heightCm: 188, weightKg: 79, wears: "M" };

const ART: Record<StyleKey, ArtKind[]> = {
  "bikini-top": ["triangleTop"],
  "bikini-bottom": ["bikiniBottom"],
  "one-piece": ["onePieceFront"],
  "cover-up": ["kaftan"],
  "cuban-shirt": ["cubanShirt"],
  "cuban-set": ["cubanSet"],
  "swim-trunks": ["trunks"],
  shorts: ["bermuda"],
  "couples-set": ["bikiniSet", "trunks"],
};

const CHARTS: Record<StyleKey, ChartKey[]> = {
  "bikini-top": ["womenTop"],
  "bikini-bottom": ["womenBottom"],
  "one-piece": ["womenOnePiece"],
  "cover-up": ["womenDress"],
  "cuban-shirt": ["menShirt"],
  "cuban-set": ["menShirt", "menBottom"],
  "swim-trunks": ["menBottom"],
  shorts: ["menBottom"],
  "couples-set": ["womenTop", "womenBottom", "menBottom"],
};

if (typeof window !== "undefined") {
  throw new Error("lib/shop.ts is server-only");
}

export function defaultSettings(): ShopSettings {
  return {
    announcement: "",
    freeShippingThreshold: SITE.freeShippingThreshold,
    flatShipping: SITE.flatShipping,
    email: SITE.email,
  };
}

export function seedInventory(product: Product, qty = SEED_STOCK): Record<string, number> {
  const inventory: Record<string, number> = {};
  for (const color of product.colors) {
    for (const combo of selectionCombos(product)) inventory[variantKey(color.name, combo.label)] = qty;
  }
  return inventory;
}

export function seedShop(): ShopData {
  return {
    seeded: true,
    settings: defaultSettings(),
    products: seedProducts.map((product) => ({
      ...product,
      colors: product.colors.map((color) => ({ ...color })),
      selectors: product.selectors.map((selector) => ({ ...selector, options: [...selector.options] })),
      status: "published" as const,
      inventory: seedInventory(product),
    })),
    promotions: [],
    wall: [],
  };
}

function blankShop(): ShopData {
  return { seeded: false, settings: defaultSettings(), products: [], promotions: [], wall: [] };
}

export function publishedProducts(shop: ShopData): Product[] {
  return shop.products.filter((product) => (product.status ?? "published") === "published");
}

export function defaultsFor(gender: Gender, style: StyleKey): Pick<Product, "art" | "charts" | "models" | "finish" | "lookWith" | "care" | "hygiene"> {
  const models = gender === "men" ? [him] : gender === "couples" ? [her, him] : [her];
  return { art: ART[style], charts: CHARTS[style], models, finish: "solid", lookWith: [], care: [], hygiene: style !== "cuban-shirt" && style !== "shorts" };
}

function normalize(raw: Partial<ShopData> | null | undefined): ShopData {
  const base = blankShop();
  if (!raw || typeof raw !== "object") return base;
  return {
    seeded: Boolean(raw.seeded),
    settings: { ...defaultSettings(), ...(raw.settings ?? {}) },
    products: Array.isArray(raw.products) ? raw.products : [],
    promotions: Array.isArray(raw.promotions) ? raw.promotions : [],
    wall: Array.isArray(raw.wall) ? raw.wall : [],
  };
}

function isBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function readFileShop(): ShopData {
  if (!existsSync(FILE)) {
    const seeded = seedShop();
    if (!isBuild() && !process.env.VERCEL) writeFileShop(seeded);
    return seeded;
  }
  try {
    const parsed = normalize(JSON.parse(readFileSync(FILE, "utf8")) as Partial<ShopData>);
    if (!parsed.seeded && parsed.products.length === 0) {
      const seeded = seedShop();
      if (!isBuild()) writeFileShop(seeded);
      return seeded;
    }
    return parsed;
  } catch {
    throw new StorageError("商品資料無法讀取。");
  }
}

function writeFileShop(shop: ShopData): void {
  if (process.env.VERCEL) {
    throw new StorageError("Vercel 無法寫入商品資料。請設定 SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY，並執行 supabase/migrations/20261117_admin_store.sql。");
  }
  mkdirSync(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(shop, null, 2), "utf8");
  renameSync(tmp, FILE);
}

type Row = { data: Partial<ShopData>; version: number };

async function readRow(): Promise<{ shop: ShopData; version: number }> {
  const { data, error } = await supabaseAdmin().from(TABLE).select("data, version").eq("id", 1).maybeSingle();
  if (error) throw new StorageError("無法讀取商品資料。請先執行 supabase/migrations/20261117_admin_store.sql。");
  if (!data) {
    const { error: insertError } = await supabaseAdmin().from(TABLE).upsert({ id: 1, data: {}, version: 0 }, { onConflict: "id", ignoreDuplicates: true });
    if (insertError) throw new StorageError("無法建立商品資料。");
    return readRow();
  }
  const row = data as Row;
  return { shop: normalize(row.data), version: Number(row.version) || 0 };
}

async function writeRow(shop: ShopData, expected: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update({ data: shop, version: expected + 1, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .eq("version", expected)
    .select("version");
  if (error) throw new StorageError("無法儲存商品資料。");
  return Array.isArray(data) && data.length === 1;
}

export async function getShop(): Promise<ShopData> {
  if (isBuild()) return seedShop();
  if (!supabaseConfigured()) return readFileShop();
  const first = await readRow();
  if (first.shop.seeded) return first.shop;
  const seeded = seedShop();
  if (await writeRow(seeded, first.version)) return seeded;
  return (await readRow()).shop;
}

export async function mutateShop<T>(fn: (shop: ShopData) => T | Promise<T>): Promise<T> {
  if (!supabaseConfigured()) {
    return withLock("shop", async () => {
      const shop = readFileShop();
      const result = await fn(shop);
      writeFileShop(shop);
      return result;
    });
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const { shop, version } = await readRow();
    if (!shop.seeded) Object.assign(shop, seedShop());
    const result = await fn(shop);
    if (await writeRow(shop, version)) return result;
    await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
  }
  throw new StorageError("商品資料正被其他人更新，請再試一次。");
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString("hex")}`;
}

export async function releaseHold(order: { items: { slug: string; color: string; size: string; qty: number }[]; promoId?: string; stockHeld?: boolean }): Promise<void> {
  if (!order.stockHeld) return;
  await mutateShop((shop) => {
    for (const item of order.items) {
      const product = shop.products.find((entry) => entry.slug === item.slug);
      if (!product?.inventory) continue;
      const key = variantKey(item.color, item.size);
      product.inventory[key] = Math.max(0, Math.floor(product.inventory[key] ?? 0)) + item.qty;
    }
    if (order.promoId) {
      const promo = shop.promotions.find((entry) => entry.id === order.promoId);
      if (promo) promo.used = Math.max(0, promo.used - 1);
    }
  });
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "piece";
}
