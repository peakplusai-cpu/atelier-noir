import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { apiJson } from "@/lib/api";
import { isStaff } from "@/lib/auth";
import { clientIpFrom, originAllowed } from "@/lib/guard";
import { imageContentType, safeUploadName, sniffImage } from "@/lib/images";
import { rateLimit } from "@/lib/rate-limit";
import { UPLOAD_BUCKET } from "@/lib/shop";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!originAllowed(request)) return apiJson({ error: "unauthorized" }, 403);
  if (!(await isStaff())) return apiJson({ error: "unauthorized" }, 401);
  if (!rateLimit(`upload:${clientIpFrom(request.headers)}`, 30, 10 * 60 * 1000).ok) {
    return apiJson({ error: "上傳太頻繁，請稍後再試" }, 429);
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return apiJson({ error: "缺少圖片" }, 400);
  if (file.size > 4 * 1024 * 1024) return apiJson({ error: "單張圖片請小於 4MB" }, 400);
  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(buffer);
  if (!kind) return apiJson({ error: "只接受 JPG、PNG、WebP、GIF" }, 400);
  const name = safeUploadName(kind, `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`);
  if (supabaseConfigured()) {
    const db = supabaseAdmin();
    const { error } = await db.storage.from(UPLOAD_BUCKET).upload(name, buffer, {
      contentType: imageContentType(kind),
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
