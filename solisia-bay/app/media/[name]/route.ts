import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(name)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(join(process.cwd(), "data", "uploads", name));
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    return new Response(bytes, {
      headers: { "content-type": TYPES[ext] ?? "application/octet-stream", "cache-control": "public, max-age=86400" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
