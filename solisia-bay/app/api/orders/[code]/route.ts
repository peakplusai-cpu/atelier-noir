import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const order = await getOrder(code);
  if (!order || order.token !== token) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ status: order.status });
}
