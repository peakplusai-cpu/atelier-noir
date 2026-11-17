import { createHash, createHmac, randomBytes } from "crypto";
import { safeEqualString } from "./secret";

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const STAFF_COOKIE_MAX_AGE_SEC = MAX_AGE_MS / 1000;

function sign(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function fingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

export function createStaffToken(secret: string, passwordHash: string, now = Date.now()): string {
  const payload = `${now + MAX_AGE_MS}.${randomBytes(16).toString("hex")}.${fingerprint(passwordHash)}`;
  return `${payload}.${sign(secret, payload)}`;
}

export function staffTokenValid(token: string, secret: string, passwordHash: string | null, now = Date.now()): boolean {
  if (!passwordHash) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [exp, nonce, fp, mac] = parts;
  if (!/^\d{10,16}$/.test(exp) || !/^[a-f0-9]{32}$/.test(nonce) || !/^[a-f0-9]{16}$/.test(fp)) return false;
  const payload = `${exp}.${nonce}.${fp}`;
  if (!safeEqualString(mac, sign(secret, payload))) return false;
  if (!safeEqualString(fp, fingerprint(passwordHash))) return false;
  return Number(exp) > now;
}
