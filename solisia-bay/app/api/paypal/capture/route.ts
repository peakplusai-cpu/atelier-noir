import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { toCents } from "@/lib/money";
import { getOrder, updateOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown; token?: unknown; paypalOrderId?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";
  const token = typeof body?.token === "string" ? body.token : "";
  const paypalOrderId = typeof body?.paypalOrderId === "string" ? body.paypalOrderId : "";

  const order = code ? await getOrder(code).catch(() => null) : null;
  if (!order || order.token !== token) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ ok: true });
  if (order.status !== "pending" || !order.paymentOrderId || order.paymentOrderId !== paypalOrderId) {
    return NextResponse.json({ error: "This payment doesn't match the order." }, { status: 409 });
  }

  try {
    const capture = await capturePayPalOrder(paypalOrderId);
    const expected = toCents(order.total);
    if (capture.customId !== order.code || capture.currency !== "USD" || capture.amountCents !== expected) {
      console.error("[paypal] capture mismatch", { code: order.code, capture, expected });
      return NextResponse.json(
        { error: "The payment amount didn't match the order. Please contact us before trying again." },
        { status: 409 }
      );
    }
    await updateOrder(
      order.code,
      { status: "paid", paymentCaptureId: capture.captureId, amountPaidCents: capture.amountCents, paidAt: new Date().toISOString() },
      ["pending"]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[paypal] capture failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "PayPal couldn't complete the payment. You have not been charged." }, { status: 502 });
  }
}
