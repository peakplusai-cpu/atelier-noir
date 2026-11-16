import { NextResponse } from "next/server";
import { processCallback } from "@/lib/payment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const raw = await request.text().catch(() => "");
  const result = await processCallback(new URLSearchParams(raw));
  if (!result.verified) return new NextResponse("invalid", { status: 400 });
  return new NextResponse("OK", { status: 200 });
}
