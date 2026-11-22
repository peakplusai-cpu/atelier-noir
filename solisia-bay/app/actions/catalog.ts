"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isStaff } from "@/lib/auth";
import { allowedImageUrl } from "@/lib/csp";
import { originAllowed } from "@/lib/guard";
import { headers } from "next/headers";
import { MEN_SIZES, WOMEN_SIZES, selectionCombos, variantKey } from "@/lib/catalog";
import { normalizeCoupon, type PromoKind, type PromoScope, type Promotion, type WallPost } from "@/lib/promos";
import { defaultsFor, getShop, mutateShop, newId, slugify, type ShopSettings } from "@/lib/shop";
import type { Colorway, Gender, Product, SizeSelector, StyleKey } from "@/lib/types";

const GENDERS: Gender[] = ["women", "men"];
const STYLES: StyleKey[] = ["tee", "shirt", "hoodie", "jacket", "pants", "shorts", "accessory"];

async function guard(): Promise<void> {
  const headerList = await headers();
  const probe = new Request("https://solisia.local/admin", {
    headers: {
      origin: headerList.get("origin") ?? "",
      host: headerList.get("host") ?? "",
      "x-forwarded-host": headerList.get("x-forwarded-host") ?? "",
    },
  });
  if (!originAllowed(probe)) redirect("/admin/login");
  if (!(await isStaff())) redirect("/admin/login");
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max) : "";
}

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function selectorsFor(gender: Gender, her: string[], his: string[]): SizeSelector[] {
  const options = gender === "men" ? (his.length ? his : [...MEN_SIZES]) : her.length ? her : [...WOMEN_SIZES];
  return [{ key: "size", label: "Size", options }];
}

function parseList(value: unknown): string[] {
  return text(value, 200)
    .split(/[,，\s]+/)
    .map((part) => part.toUpperCase())
    .filter(Boolean)
    .slice(0, 12);
}

export async function saveProduct(_prev: string, form: FormData): Promise<string> {
  await guard();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(text(form.get("payload"), 80_000)) as Record<string, unknown>;
  } catch {
    return "資料格式不正確";
  }
  const slug = text(form.get("slug"), 80);
  const name = text(payload.name, 120);
  if (name.length < 2) return "請輸入商品名稱";
  const gender = GENDERS.includes(payload.gender as Gender) ? (payload.gender as Gender) : null;
  const style = STYLES.includes(payload.style as StyleKey) ? (payload.style as StyleKey) : null;
  if (!gender || !style) return "請選擇分類";
  const price = Math.round(num(payload.price) * 100) / 100;
  if (price <= 0 || price > 1_000_000) return "售價必須大於 0，且不可超過 1000000";
  const compareAt = Math.round(num(payload.compareAt) * 100) / 100;
  const colors = (Array.isArray(payload.colors) ? payload.colors : [])
    .map((color) => {
      const row = color as { name?: unknown; hex?: unknown };
      const colorName = text(row.name, 40);
      const hex = /^#[0-9a-fA-F]{6}$/.test(text(row.hex, 7)) ? text(row.hex, 7) : "#C5A059";
      return colorName ? { name: colorName, hex } : null;
    })
    .filter((color): color is Colorway => Boolean(color))
    .slice(0, 8);
  if (!colors.length) return "請至少設定一個顏色";
  const selectors = selectorsFor(gender, parseList(payload.herSizes), parseList(payload.hisSizes));
  const inventoryIn = payload.inventory && typeof payload.inventory === "object" ? (payload.inventory as Record<string, unknown>) : {};
  const photos = (Array.isArray(payload.photos) ? payload.photos : [])
    .filter((url): url is string => typeof url === "string" && allowedImageUrl(url))
    .slice(0, 8);
  const details = text(payload.details, 2000)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
  const status = payload.status === "draft" ? "draft" : "published";
  const tagline = text(payload.tagline, 160);
  const description = text(payload.description, 2000);
  const nameEn = text(payload.nameEn, 120);
  const descriptionEn = text(payload.descriptionEn, 2000);
  const brand = text(payload.brand, 40);
  const tags = text(payload.tags, 160)
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);

  let error = "";
  await mutateShop((shop) => {
    const existing = slug ? shop.products.find((product) => product.slug === slug) : undefined;
    if (slug && !existing) {
      error = "找不到這個商品";
      return;
    }
    let nextSlug = existing?.slug ?? slugify(name);
    if (!existing && shop.products.some((product) => product.slug === nextSlug)) nextSlug = `${nextSlug}-${newId("n").slice(-4)}`;
    const draft: Product = {
      ...(existing ?? defaultsFor(gender, style)),
      slug: nextSlug,
      name,
      nameEn: nameEn || undefined,
      gender,
      style,
      price,
      compareAt: compareAt > price ? compareAt : undefined,
      tagline: tagline || name,
      description: description || tagline || name,
      descriptionEn: descriptionEn || undefined,
      brand: brand || undefined,
      tags: tags.length ? tags : undefined,
      details: details.length ? details : existing?.details ?? [],
      colors,
      selectors,
      bestseller: Boolean(payload.bestseller),
      isNew: Boolean(payload.isNew),
      status,
      inventory: {},
      media: photos.length
        ? { front: photos[0], back: photos[1], gallery: photos.slice(2) }
        : existing?.media,
    };
    const inventory: Record<string, number> = {};
    for (const color of colors) {
      for (const combo of selectionCombos(draft)) {
        const key = variantKey(color.name, combo.label);
        const raw = inventoryIn[key];
        inventory[key] = Math.max(0, Math.floor(num(raw === undefined ? existing?.inventory?.[key] ?? 0 : raw)));
      }
    }
    draft.inventory = inventory;
    if (existing) Object.assign(existing, draft);
    else shop.products.push(draft);
  });
  if (error) return error;
  revalidatePath("/", "layout");
  redirect("/admin/products?saved=1");
}

export async function setProductStatus(form: FormData): Promise<void> {
  await guard();
  const slug = text(form.get("slug"), 80);
  const status = text(form.get("status"), 20) === "draft" ? "draft" : "published";
  await mutateShop((shop) => {
    const product = shop.products.find((item) => item.slug === slug);
    if (product) product.status = status;
  });
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(form: FormData): Promise<void> {
  await guard();
  const slug = text(form.get("slug"), 80);
  await mutateShop((shop) => {
    shop.products = shop.products.filter((product) => product.slug !== slug);
  });
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function savePromotion(_prev: string, form: FormData): Promise<string> {
  await guard();
  const id = text(form.get("id"), 40);
  const name = text(form.get("name"), 80);
  if (!name) return "請輸入活動名稱";
  const kind = (["percent", "amount", "shipping"].includes(text(form.get("kind"), 20)) ? text(form.get("kind"), 20) : "percent") as PromoKind;
  const scope = (["all", "gender", "product"].includes(text(form.get("scope"), 20)) ? text(form.get("scope"), 20) : "all") as PromoScope;
  const value = Math.round(num(form.get("value")) * 100) / 100;
  if (kind === "percent" && (value <= 0 || value > 100)) return "折扣百分比要介於 1 到 100";
  if (kind === "amount" && value <= 0) return "折抵金額必須大於 0";
  const starts = text(form.get("startsAt"), 20);
  const ends = text(form.get("endsAt"), 20);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(starts) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(ends)) return "請填開始與結束時間";
  const startsAt = new Date(`${starts}:00+08:00`).toISOString();
  const endsAt = new Date(`${ends}:00+08:00`).toISOString();
  if (Date.parse(endsAt) <= Date.parse(startsAt)) return "結束時間要晚於開始時間";
  const code = normalizeCoupon(text(form.get("code"), 24));
  const gender = GENDERS.includes(text(form.get("gender"), 20) as Gender) ? (text(form.get("gender"), 20) as Gender) : "";
  const slug = text(form.get("slug"), 80);
  if (scope === "gender" && !gender) return "請選擇分類";
  if (scope === "product" && !slug) return "請選擇商品";
  let message = "";
  await mutateShop((shop) => {
    if (code && shop.promotions.some((promo) => promo.id !== id && normalizeCoupon(promo.code) === code)) {
      message = "這個優惠碼已經被使用";
      return;
    }
    if (scope === "product" && !shop.products.some((product) => product.slug === slug)) {
      message = "找不到指定商品";
      return;
    }
    const next: Promotion = {
      id: id || newId("prm"),
      name,
      code,
      enabled: form.get("enabled") === "on",
      kind,
      value: kind === "shipping" ? 0 : value,
      minSubtotal: Math.max(0, Math.round(num(form.get("minSubtotal")) * 100) / 100),
      scope,
      gender: scope === "gender" ? gender : "",
      slug: scope === "product" ? slug : "",
      startsAt,
      endsAt,
      usageLimit: Math.max(0, Math.floor(num(form.get("usageLimit")))),
      used: shop.promotions.find((promo) => promo.id === id)?.used ?? 0,
      createdAt: shop.promotions.find((promo) => promo.id === id)?.createdAt ?? new Date().toISOString(),
    };
    const existing = id ? shop.promotions.find((promo) => promo.id === id) : undefined;
    if (id && !existing) {
      message = "找不到這個優惠";
      return;
    }
    if (existing) Object.assign(existing, next);
    else shop.promotions.push(next);
  });
  if (message) return message;
  revalidatePath("/", "layout");
  redirect("/admin/promotions?saved=1");
}

export async function setPromotionEnabled(form: FormData): Promise<void> {
  await guard();
  const id = text(form.get("id"), 40);
  const enabled = text(form.get("enabled"), 5) === "1";
  await mutateShop((shop) => {
    const promo = shop.promotions.find((item) => item.id === id);
    if (promo) promo.enabled = enabled;
  });
  revalidatePath("/", "layout");
  redirect("/admin/promotions");
}

export async function deletePromotion(form: FormData): Promise<void> {
  await guard();
  const id = text(form.get("id"), 40);
  await mutateShop((shop) => {
    shop.promotions = shop.promotions.filter((promo) => promo.id !== id);
  });
  revalidatePath("/", "layout");
  redirect("/admin/promotions");
}

export async function saveWall(_prev: string, form: FormData): Promise<string> {
  await guard();
  let posts: WallPost[] = [];
  try {
    const parsed = JSON.parse(text(form.get("posts"), 40_000)) as WallPost[];
    posts = (Array.isArray(parsed) ? parsed : [])
      .map((post) => ({
        id: text(post.id, 40) || newId("wall"),
        image: text(post.image, 400),
        caption: text(post.caption, 180),
        slug: text(post.slug, 80),
        published: Boolean(post.published),
        createdAt: text(post.createdAt, 40) || new Date().toISOString(),
      }))
      .filter((post) => allowedImageUrl(post.image))
      .slice(0, 24);
  } catch {
    return "資料格式不正確";
  }
  await mutateShop((shop) => {
    shop.wall = posts;
  });
  revalidatePath("/", "layout");
  return "已儲存";
}

export async function saveSettings(_prev: string, form: FormData): Promise<string> {
  await guard();
  const settings: ShopSettings = {
    announcement: text(form.get("announcement"), 180),
    freeShippingThreshold: Math.max(0, Math.round(num(form.get("freeShippingThreshold")) * 100) / 100),
    flatShipping: Math.max(0, Math.round(num(form.get("flatShipping")) * 100) / 100),
    email: text(form.get("email"), 120) || "hello@solisiabay.com",
  };
  if (settings.freeShippingThreshold <= 0 || settings.flatShipping < 0) return "請填有效的運費門檻與運費";
  await mutateShop((shop) => {
    shop.settings = settings;
  });
  revalidatePath("/", "layout");
  return "已儲存";
}

export async function loadShop() {
  await guard();
  return getShop();
}
