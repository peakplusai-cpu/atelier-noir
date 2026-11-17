import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { updateOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function verify(raw: string, signature: string | null): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

type CheckoutObject = {
  id?: string;
  request_id?: string;
  status?: string;
  metadata?: Record<string, unknown> | null;
  order?: { id?: string; amount_paid?: number; amount?: number; status?: string } | null;
};

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verify(raw, request.headers.get("creem-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { eventType?: string; object?: CheckoutObject };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (event.eventType === "checkout.completed" && event.object) {
    const obj = event.object;
    const metaCode = obj.metadata && typeof obj.metadata.order_code === "string" ? obj.metadata.order_code : "";
    const code = metaCode || obj.request_id || "";
    const paid = obj.status === "completed" && (!obj.order?.status || obj.order.status === "paid");
    if (code && paid) {
      await updateOrder(
        code,
        {
          status: "paid",
          creemCheckoutId: obj.id ?? null,
          creemOrderId: obj.order?.id ?? null,
          amountPaidCents: obj.order?.amount_paid ?? obj.order?.amount ?? null,
          paidAt: new Date().toISOString(),
        },
        ["pending", "failed"]
      );
    }
  }

  return NextResponse.json({ received: true });
}
