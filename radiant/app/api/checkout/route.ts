import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getLineIdentity, lineLoginEnabled } from "@/lib/line";
import { enabledPickupPoints } from "@/lib/pickup";
import { placeOrder, type CartLine } from "@/lib/orders";
import { payConfig } from "@/lib/newebpay";
import { CVS_BRANDS } from "@/lib/cvs";
import type { Fulfillment, PaymentMethod } from "@/lib/types";

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "資料格式不正確" }, { status: 400 });

  const { settings } = await getStore();
  const identity = await getLineIdentity();
  const loginRequired = lineLoginEnabled(settings);

  if (loginRequired && !identity) {
    return NextResponse.json({ error: "請先使用 LINE 登入" }, { status: 401 });
  }

  const recipient = text(body.recipient, 60);
  const phone = text(body.phone, 30);
  const address = text(body.address, 200);
  const kind = text(body.fulfillment, 20);
  const fulfillment: Fulfillment = kind === "pickup" ? "pickup" : kind === "cvs" ? "cvs" : "delivery";
  const pickupPointId = text(body.pickupPointId, 80);
  const cvsBrand = text(body.cvsBrand, 20);
  const cvsStoreName = text(body.cvsStoreName, 60);
  const cvsStoreCode = text(body.cvsStoreCode, 20);
  const rawPay = text(body.paymentMethod, 20);
  const paymentMethod: PaymentMethod = rawPay === "online" ? "online" : rawPay === "cod" ? "cod" : "offline";

  if (!recipient || !phone) {
    return NextResponse.json({ error: "請填寫姓名與電話" }, { status: 400 });
  }
  if (fulfillment === "pickup") {
    const point = enabledPickupPoints(settings).find((p) => p.id === pickupPointId);
    if (!point) return NextResponse.json({ error: "請選擇自取地點" }, { status: 400 });
  } else if (fulfillment === "cvs") {
    if (!settings.cvsEnabled) return NextResponse.json({ error: "目前未開放超商取貨" }, { status: 400 });
    if (!CVS_BRANDS.includes(cvsBrand)) return NextResponse.json({ error: "請選擇超商品牌" }, { status: 400 });
    if (!cvsStoreName || !cvsStoreCode) {
      return NextResponse.json({ error: "請填寫門市名稱與店號" }, { status: 400 });
    }
  } else if (!address) {
    return NextResponse.json({ error: "請完整填寫收件人、電話與地址" }, { status: 400 });
  }
  if (paymentMethod === "online" && !payConfig(settings).ready) {
    return NextResponse.json({ error: "線上付款目前未開放" }, { status: 400 });
  }
  if (paymentMethod === "cod" && !(fulfillment === "cvs" && settings.cvsCodEnabled)) {
    return NextResponse.json({ error: "取貨付款僅限超商取貨" }, { status: 400 });
  }

  let lineName = identity?.name ?? "";
  let lineId = text(body.lineId, 60).replace(/^@/, "");
  if (!identity) {
    lineName = text(body.lineName, 60);
    if (!lineName || !lineId) {
      return NextResponse.json({ error: "請填寫 LINE 名稱與 LINE ID" }, { status: 400 });
    }
  }

  const rawLines = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : [];
  const lines: CartLine[] = rawLines.slice(0, 50).map((l) => ({
    productId: text(l.productId, 60),
    variantId: text(l.variantId, 60),
    qty: Number(l.qty),
  }));

  const result = await placeOrder({
    lines,
    recipient,
    phone,
    address,
    fulfillment,
    pickupPointId,
    cvsBrand,
    cvsStoreName,
    cvsStoreCode,
    paymentMethod,
    note: text(body.note, 300),
    identity: {
      lineUserId: identity?.userId ?? "",
      lineName,
      lineId,
      verified: Boolean(identity),
    },
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  const { code, token } = result.order;
  const payUrl =
    paymentMethod === "online" ? `/api/payment/newebpay/start?code=${code}&t=${token}` : undefined;
  return NextResponse.json({ code, token, payUrl });
}
