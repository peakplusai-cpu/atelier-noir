import { applyTrade } from "../notify/route";
import { getOrder } from "@/lib/orders";
import { newebpayConfig, openTrade } from "@/lib/newebpay";
import { siteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = newebpayConfig();
  if (!config) return new Response("付款功能尚未開通", { status: 503 });
  const form = await request.formData();
  const trade = openTrade(
    { TradeInfo: String(form.get("TradeInfo") ?? ""), TradeSha: String(form.get("TradeSha") ?? "") },
    config.hashKey,
    config.hashIv
  );
  if (!trade) return new Response("invalid", { status: 400 });
  await applyTrade(trade);
  const order = await getOrder(trade.orderNo);
  const next = order
    ? `${siteOrigin()}/checkout/success?order=${encodeURIComponent(order.code)}&token=${encodeURIComponent(order.token)}`
    : `${siteOrigin()}/checkout`;
  return Response.redirect(next, 303);
}
