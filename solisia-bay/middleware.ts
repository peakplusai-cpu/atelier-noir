import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { contentSecurityPolicy } from "./lib/csp";
import { PREF_COOKIE, resolveMarket } from "./lib/market";

export function middleware(request: NextRequest) {
  const market = resolveMarket(request.headers.get("x-vercel-ip-country"), request.cookies.get(PREF_COOKIE)?.value ?? null);
  const headers = new Headers(request.headers);
  headers.set("x-clack-lang", market.lang);
  headers.set("x-clack-currency", market.currency);
  headers.set("x-clack-country", market.country);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy());
  response.headers.set("Vary", "x-vercel-ip-country, Cookie");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
