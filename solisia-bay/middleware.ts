import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { contentSecurityPolicy } from "./lib/csp";
import { PREF_COOKIE } from "./lib/market";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", contentSecurityPolicy());
  response.headers.set("Cache-Control", "private, no-store");
  if (request.cookies.has(PREF_COOKIE)) {
    response.cookies.set(PREF_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
