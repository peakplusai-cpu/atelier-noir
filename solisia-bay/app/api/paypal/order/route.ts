import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";
import { getOrder, updateOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown; token?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";
  const token = typeof body?.token === "string" ? body.token : "";

  const order = code ? await getOrder(code).catch(() => null) : null;
  if (!order || order.token !== token) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "pending") return NextResponse.json({ error: "This order can no longer be paid." }, { status: 409 });

  try {
    const id = await createPayPalOrder({
      code: order.code,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      items: order.items.map((i) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice })),
    });
    await updateOrder(order.code, { paymentOrderId: id });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("[paypal] create order failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "We couldn't start PayPal checkout. Please try again." }, { status: 502 });
  }
}
