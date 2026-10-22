import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { uid } from "@/lib/id";

const ALLOWED = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED.has(ext)) {
    return NextResponse.json({ error: "僅支援 JPG、PNG、WebP、GIF" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "單張圖片請小於 8MB" }, { status: 400 });
  }
  const name = `${uid("img")}.${ext}`;
  const dir = join(process.cwd(), "data", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/media/${name}` });
}
