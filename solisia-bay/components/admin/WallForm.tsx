"use client";

import { useActionState, useRef, useState } from "react";
import { saveWall } from "@/app/actions/catalog";
import type { WallPost } from "@/lib/promos";
import type { Product } from "@/lib/types";

export function WallForm({ posts, products }: { posts: WallPost[]; products: Product[] }) {
  const [message, action, pending] = useActionState(saveWall, "");
  const [items, setItems] = useState(posts);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError("");
    const added: WallPost[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.url) added.push({ id: "", image: json.url, caption: "", slug: "", published: true, createdAt: new Date().toISOString() });
      else setUploadError(json.error ?? "上傳失敗");
    }
    setItems((list) => [...list, ...added].slice(0, 24));
    setUploading(false);
  }

  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="posts" value={JSON.stringify(items)} />
      <div className="photo-row">
        {items.map((post, index) => (
          <figure key={`${post.image}-${index}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image} alt="" />
            <input value={post.caption} placeholder="說明" onChange={(e) => setItems((list) => list.map((item, i) => i === index ? { ...item, caption: e.target.value } : item))} />
            <select value={post.slug} onChange={(e) => setItems((list) => list.map((item, i) => i === index ? { ...item, slug: e.target.value } : item))}>
              <option value="">不連結商品</option>
              {products.map((product) => <option key={product.slug} value={product.slug}>{product.name}</option>)}
            </select>
            <label className="check"><input type="checkbox" checked={post.published} onChange={(e) => setItems((list) => list.map((item, i) => i === index ? { ...item, published: e.target.checked } : item))} /> 前台顯示</label>
            <button type="button" onClick={() => setItems((list) => list.filter((_, i) => i !== index))}>移除</button>
          </figure>
        ))}
      </div>
      <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "上傳中…" : "上傳照片"}</button>
      <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(e) => void upload(e.target.files)} />
      {uploadError && <p className="form-error">{uploadError}</p>}
      {message && <p className="fine">{message}</p>}
      <button className="btn btn-solid" disabled={pending}>{pending ? "儲存中…" : "儲存動態牆"}</button>
    </form>
  );
}
