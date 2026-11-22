import { cookies, headers } from "next/headers";
import { PREF_COOKIE, resolveMarket, type Market } from "./market";

export async function getMarket(): Promise<Market> {
  const headerStore = await headers();
  const jar = await cookies();
  return resolveMarket(headerStore.get("x-vercel-ip-country"), jar.get(PREF_COOKIE)?.value ?? null);
}
