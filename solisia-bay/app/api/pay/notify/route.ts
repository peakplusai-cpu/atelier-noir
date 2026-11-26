import { getOrder, updateOrder } from "@/lib/orders";
import { isNumberNotice, isPaidNotice, newebpayConfig, openTrade, type ParsedTrade } from "@/lib/newebpay";

export const dynamic = "force-dynamic";

export async function applyTrade(trade: ParsedTrade): Promise<Response> {
  const order = await getOrder(trade.orderNo);
  if (!order) return new Response("missing", { status: 404 });
  if (Math.round(order.total) !== trade.amount) return new Response("amount", { status: 400 });
  if (order.status === "paid" || order.status === "shipped" || order.status === "completed") return new Response("OK");
  if (isPaidNotice(trade)) {
    await updateOrder(
      order.code,
      {
        status: "paid",
        paymentOrderId: trade.tradeNo || order.paymentOrderId,
        paymentCaptureId: trade.tradeNo || order.paymentCaptureId,
        amountPaidCents: trade.amount * 100,
        paidAt: new Date().toISOString(),
        payment: { method: trade.paymentType, tradeNo: trade.tradeNo },
      },
      ["pending", "review"]
    );
    return new Response("OK");
  }
  if (isNumberNotice(trade)) {
    await updateOrder(order.code, {
      paymentOrderId: trade.tradeNo || order.paymentOrderId,
      payment: {
        method: trade.paymentType,
        bankCode: trade.bankCode,
        codeNo: trade.codeNo,
        expireDate: trade.expireDate,
        tradeNo: trade.tradeNo,
      },
    });
  }
  return new Response("OK");
}

export async function POST(request: Request) {
  const config = newebpayConfig();
  if (!config) return new Response("disabled", { status: 503 });
  const form = await request.formData();
  const trade = openTrade(
    { TradeInfo: String(form.get("TradeInfo") ?? ""), TradeSha: String(form.get("TradeSha") ?? "") },
    config.hashKey,
    config.hashIv
  );
  if (!trade) return new Response("invalid", { status: 400 });
  return applyTrade(trade);
}
