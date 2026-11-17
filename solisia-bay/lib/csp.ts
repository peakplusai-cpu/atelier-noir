/** Exact https origin from SUPABASE_URL. Never a wildcard such as *.supabase.co. */
export function supabaseStorageOrigin(raw = process.env.SUPABASE_URL || ""): string {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    if (!/^[a-z0-9.-]+$/i.test(url.hostname) || url.hostname.includes("..") || url.hostname.startsWith(".")) return "";
    return url.origin;
  } catch {
    return "";
  }
}

export function allowedImageUrl(url: string, storageOrigin = supabaseStorageOrigin()): boolean {
  if (/^\/media\/[a-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(url)) return true;
  if (!storageOrigin) return false;
  const prefix = `${storageOrigin}/storage/v1/object/public/solisia-uploads/`;
  if (!url.startsWith(prefix)) return false;
  const name = url.slice(prefix.length).split("?")[0];
  return /^[a-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(name);
}

export function contentSecurityPolicy(storageOrigin = supabaseStorageOrigin()): string {
  const img = ["'self'", "data:", "blob:", "https://www.paypal.com", "https://www.paypalobjects.com", "https://images.unsplash.com"];
  if (storageOrigin) img.push(storageOrigin);
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com",
    "script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.sandbox.paypal.com https://www.paypalobjects.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img.join(" ")}`,
    "font-src 'self'",
    "connect-src 'self' https://www.paypal.com https://www.sandbox.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.paypalobjects.com",
    "frame-src https://www.paypal.com https://www.sandbox.paypal.com https://www.paypalobjects.com",
    "worker-src 'self' blob:",
  ].join("; ");
}
