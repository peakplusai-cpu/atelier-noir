import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { apiJson } from "@/lib/api";
import { isStaff } from "@/lib/auth";
import { originAllowed } from "@/lib/guard";
import { UPLOAD_BUCKET } from "@/lib/shop";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" } as const;

function sniff(buf: Buffer): keyof typeof TYPES | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return "png";
  if (buf.length > 6 && (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a")) return "gif";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function POST(request: Request) {
  if (!originAllowed(request)) return apiJson({ error: "unauthorized" }, 403);
  if (!(await isStaff())) return apiJson({ error: "unauthorized" }, 401);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return apiJson({ error: "缺少圖片" }, 400);
  if (file.size > 4 * 1024 * 1024) return apiJson({ error: "單張圖片請小於 4MB" }, 400);
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buffer);
  if (!ext) return apiJson({ error: "只接受 JPG、PNG、WebP、GIF" }, 400);
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext === "jpg" ? "jpg" : ext}`;
  if (supabaseConfigured()) {
    const db = supabaseAdmin();
    const { error } = await db.storage.from(UPLOAD_BUCKET).upload(name, buffer, {
      contentType: TYPES[ext],
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) return apiJson({ error: "上傳失敗。請確認已建立 solisia-uploads 儲存桶。" }, 500);
    return apiJson({ url: db.storage.from(UPLOAD_BUCKET).getPublicUrl(name).data.publicUrl });
  }
  if (process.env.VERCEL) return apiJson({ error: "正式環境請先設定 Supabase 才能上傳圖片" }, 503);
  const dir = join(process.cwd(), "data", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), buffer);
  return apiJson({ url: `/media/${name}` });
}
