import { siteOrigin } from "./site";

type HeaderSource = { get(name: string): string | null };

export function clientIpFrom(headers: HeaderSource): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last.slice(0, 64);
  }
  return "local";
}

/**
 * Browser CSRF check. A missing Origin is allowed (non-browser clients).
 * A present Origin must match the request host or the configured site origin.
 */
export function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let sent: URL;
  try {
    sent = new URL(origin);
  } catch {
    return false;
  }
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim();
  if (host && sent.host === host) return true;
  try {
    return sent.origin === new URL(siteOrigin()).origin;
  } catch {
    return false;
  }
}

export async function readJson(request: Request, maxBytes = 24_000): Promise<unknown> {
  const advertised = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(advertised) && advertised > maxBytes) {
    throw Object.assign(new Error("payload"), { status: 413 });
  }
  const text = await request.text();
  if (text.length > maxBytes) throw Object.assign(new Error("payload"), { status: 413 });
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
