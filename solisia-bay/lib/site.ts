export const SITE = {
  name: "CLACK",
  currency: "USD",
  freeShippingThreshold: 120,
  flatShipping: 12,
  returnDays: 30,
  email: "hello@solisiabay.com",
  // Drop real campaign media into /public and set these to switch the hero from the art-directed scene to photography/video.
  heroImage: "",
  heroVideo: "",
} as const;

export function siteOrigin(): string {
  const explicit = process.env.SITE_ORIGIN;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3200";
}
