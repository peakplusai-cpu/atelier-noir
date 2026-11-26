import { NextResponse } from "next/server";
import { sweepExpiredOrders } from "@/lib/orders";
import { safeEqual } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization") ?? "";
    if (!safeEqual(header, `Bearer ${secret}`)) return new NextResponse("unauthorized", { status: 401 });
  }
  const cancelled = await sweepExpiredOrders();
  return NextResponse.json({ cancelled });
}
