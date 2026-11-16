import { NextResponse } from "next/server";
import { processCallback } from "@/lib/payment";
import { siteOrigin } from "@/lib/line";

export const dynamic = "force-dynamic";

async function finish(raw: string) {
  const origin = await siteOrigin();
  const result = await processCallback(new URLSearchParams(raw));
  if (!result.verified) return NextResponse.redirect(new URL("/", origin), 303);
  const { outcome } = result;
  if (outcome.kind === "unknown") return NextResponse.redirect(new URL("/", origin), 303);
  const { order } = outcome;
  const back = new URL(`/order/${order.code}`, origin);
  back.searchParams.set("t", order.token);
  back.searchParams.set("pay", outcome.kind === "paid" || outcome.kind === "duplicate" ? "ok" : "failed");
  return NextResponse.redirect(back, 303);
}

export async function POST(request: Request) {
  return finish(await request.text().catch(() => ""));
}

export async function GET() {
  return NextResponse.redirect(new URL("/", await siteOrigin()), 303);
}
