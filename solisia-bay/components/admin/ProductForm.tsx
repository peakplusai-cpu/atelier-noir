"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import { saveProduct } from "@/app/actions/catalog";
import { MEN_SIZES, STYLE_LABELS, WOMEN_SIZES, selectionCombos, variantKey } from "@/lib/catalog";
import type { Colorway, Gender, Product, StyleKey } from "@/lib/types";

const STYLES = Object.keys(STYLE_LABELS) as StyleKey[];

export function ProductForm({ product }: { product?: Product }) {
  const [error, action, pending] = useActionState(saveProduct, "");
  const [name, setName] = useState(product?.name ?? "");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [details, setDetails] = useState((product?.details ?? []).join("\n"));
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [compareAt, setCompareAt] = useState(product?.compareAt ? String(product.compareAt) : "");
  const [gender, setGender] = useState<Gender>(product?.gender === "men" ? "men" : "women");
  const [style, setStyle] = useState<StyleKey>(product && product.style in STYLE_LABELS ? product.style : "tee");
  const [colors, setColors] = useState<Colorway[]>(product?.colors ?? [{ name: "", hex: "#C5A059" }]);
  const [herSizes, setHerSizes] = useState(sizeText(product, "women"));
  const [hisSizes, setHisSizes] = useState(sizeText(product, "men"));
  const [inventory, setInventory] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const [key, qty] of Object.entries(product?.inventory ?? {})) next[key] = String(qty);
    return next;
  });
  const [photos, setPhotos] = useState<string[]>(photosOf(product));
  const [published, setPublished] = useState((product?.status ?? "published") === "published");
  const [bestseller, setBestseller] = useState(Boolean(product?.bestseller));
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [tags, setTags] = useState((product?.tags ?? []).join(", "));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const draft = useMemo(() => {
    const selectors =
      [{ key: "size", label: "Size", options: splitSizes(gender === "men" ? hisSizes : herSizes, gender === "men" ? MEN_SIZES : WOMEN_SIZES) }];
    return { selectors, colors: colors.filter((color) => color.name.trim()) } as Pick<Product, "selectors" | "colors">;
  }, [gender, herSizes, hisSizes, colors]);

  const slots = selectionCombos({ ...draft, selectors: draft.selectors } as Product);

  const payload = JSON.stringify({
    name,
    tagline,
    description,
    details,
    price: Number(price),
    compareAt: Number(compareAt || 0),
    gender,
    style,
    colors,
    herSizes,
    hisSizes,
    inventory,
    photos,
    status: published ? "published" : "draft",
    bestseller,
    isNew: product?.isNew ?? false,
    brand,
    tags,
  });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError("");
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.url) urls.push(json.url);
      else setUploadError(json.error ?? "上傳失敗");
    }
    setPhotos((list) => [...list, ...urls].slice(0, 8));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="slug" value={product?.slug ?? ""} />
      <input type="hidden" name="payload" value={payload} />
      <section className="admin-panel">
        <h2>基本資料</h2>
        <label className="field"><span>名稱</span><input name="visible-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} /></label>
        <label className="field"><span>一句話</span><input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={160} /></label>
        <label className="field"><span>品牌 brand</span><input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={40} placeholder="CLACK" /></label>
        <label className="field"><span>標籤 tags</span><input value={tags} onChange={(e) => setTags(e.target.value)} maxLength={160} placeholder="滑板, 街舞" /></label>
        <label className="field"><span>說明</span><textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} /></label>
        <label className="field"><span>細節（一行一項）</span><textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} /></label>
        <div className="field-row">
          <label className="field"><span>分類</span>
            <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
              <option value="women">女裝 Women</option>
              <option value="men">男裝 Men</option>
            </select>
          </label>
          <label className="field"><span>款式</span>
            <select value={style} onChange={(e) => setStyle(e.target.value as StyleKey)}>
              {STYLES.map((key) => <option key={key} value={key}>{STYLE_LABELS[key]}</option>)}
            </select>
          </label>
        </div>
      </section>
      <section className="admin-panel">
        <h2>售價與上架</h2>
        <div className="field-row">
          <label className="field"><span>售價 TWD</span><input type="number" min={1} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></label>
          <label className="field"><span>原價 compare-at</span><input type="number" min={0} step="0.01" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} /></label>
        </div>
        <label className="check"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> 上架（前台可見）</label>
        <label className="check"><input type="checkbox" checked={bestseller} onChange={(e) => setBestseller(e.target.checked)} /> 熱銷</label>
      </section>
      <section className="admin-panel">
        <h2>顏色、尺寸、庫存</h2>
        {colors.map((color, index) => (
          <div className="field-row" key={index}>
            <label className="field"><span>顏色</span><input value={color.name} onChange={(e) => setColors((list) => list.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} /></label>
            <label className="field"><span>色票</span><input type="color" value={color.hex} onChange={(e) => setColors((list) => list.map((item, i) => i === index ? { ...item, hex: e.target.value } : item))} /></label>
            <button type="button" className="link-btn" onClick={() => setColors((list) => list.filter((_, i) => i !== index))} disabled={colors.length === 1}>移除</button>
          </div>
        ))}
        <button type="button" className="btn btn-outline" onClick={() => setColors((list) => [...list, { name: "", hex: "#1B365D" }])}>新增顏色</button>
        {gender !== "men" && <label className="field"><span>尺寸</span><input value={herSizes} onChange={(e) => setHerSizes(e.target.value)} placeholder={WOMEN_SIZES.join(", ")} /></label>}
        {gender === "men" && <label className="field"><span>尺寸</span><input value={hisSizes} onChange={(e) => setHisSizes(e.target.value)} placeholder={MEN_SIZES.join(", ")} /></label>}
        <div className="stock-grid">
          {draft.colors.flatMap((color) => slots.map((slot) => {
            const key = variantKey(color.name, slot.label);
            return (
              <label className="field" key={key}>
                <span>{color.name} · {slot.label}</span>
                <input type="number" min={0} step={1} value={inventory[key] ?? "0"} onChange={(e) => setInventory((map) => ({ ...map, [key]: e.target.value }))} />
              </label>
            );
          }))}
        </div>
      </section>
      <section className="admin-panel">
        <h2>圖片</h2>
        <div className="photo-row">
          {photos.map((src) => (
            <figure key={src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              <button type="button" onClick={() => setPhotos((list) => list.filter((item) => item !== src))}>移除</button>
            </figure>
          ))}
        </div>
        <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "上傳中…" : "上傳圖片"}</button>
        <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(e) => void upload(e.target.files)} />
        {uploadError && <p className="form-error">{uploadError}</p>}
      </section>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="staff-actions">
        <button className="btn btn-solid" disabled={pending || uploading}>{pending ? "儲存中…" : "儲存商品"}</button>
        <Link href="/admin/products" className="btn btn-outline">取消</Link>
      </div>
    </form>
  );
}

function splitSizes(value: string, fallback: string[]): string[] {
  const list = value.split(/[,，\s]+/).map((part) => part.trim().toUpperCase()).filter(Boolean);
  return list.length ? list : fallback;
}

function sizeText(product: Product | undefined, who: "women" | "men"): string {
  if (!product) return who === "women" ? WOMEN_SIZES.join(", ") : MEN_SIZES.join(", ");
  const key = product.selectors.length > 1 ? (who === "women" ? "her" : "his") : "size";
  const found = product.selectors.find((selector) => selector.key === key);
  return (found?.options ?? (who === "women" ? WOMEN_SIZES : MEN_SIZES)).join(", ");
}

function photosOf(product?: Product): string[] {
  if (!product?.media) return [];
  return [product.media.front, product.media.back, ...(product.media.gallery ?? [])].filter((src): src is string => Boolean(src));
}
