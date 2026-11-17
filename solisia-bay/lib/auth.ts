import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getStaff } from "./staff";

const COOKIE = "solisia_staff";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== test.length) return false;
  return timingSafeEqual(expected, test);
}

function sign(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function createStaffSession(): Promise<void> {
  const { secret } = await getStaff();
  const payload = `${Date.now() + THIRTY_DAYS}.${randomBytes(16).toString("hex")}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(secret, payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS / 1000,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroyStaffSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isStaff(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, mac] = parts;
  const { secret } = await getStaff();
  if (!safeEqual(mac, sign(secret, `${exp}.${nonce}`))) return false;
  return Number(exp) > Date.now();
}

export async function staffReady(): Promise<boolean> {
  return Boolean((await getStaff()).passwordHash);
}
