import { cookies } from "next/headers";
import { getStaff } from "./staff";
import { createStaffToken, STAFF_COOKIE_MAX_AGE_SEC, staffTokenValid } from "./session-token";

const COOKIE = "solisia_staff";

export async function createStaffSession(): Promise<void> {
  const staff = await getStaff();
  if (!staff.passwordHash) throw new Error("Staff password is not set");
  const jar = await cookies();
  jar.set(COOKIE, createStaffToken(staff.secret, staff.passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_COOKIE_MAX_AGE_SEC,
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
  const { secret, passwordHash } = await getStaff();
  return staffTokenValid(token, secret, passwordHash);
}

export async function staffReady(): Promise<boolean> {
  return Boolean((await getStaff()).passwordHash);
}
