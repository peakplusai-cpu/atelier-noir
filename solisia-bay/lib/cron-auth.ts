import { safeEqualString } from "./secret";

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when that env var is set. */
export function cronAuthStatus(header: string | null, secret = process.env.CRON_SECRET ?? ""): "ok" | "unconfigured" | "rejected" {
  if (secret.length < 16) return "unconfigured";
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token || token.length !== secret.length || !safeEqualString(token, secret)) return "rejected";
  return "ok";
}
