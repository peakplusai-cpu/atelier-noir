import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { siteOrigin } from "@/lib/line";
import { startPayment } from "@/lib/orders";
import { buildMpgForm, payConfig } from "@/lib/newebpay";

export const dynamic = "force-dynamic";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("code") ?? "").slice(0, 40);
  const token = (url.searchParams.get("t") ?? "").slice(0, 80);
  const origin = await siteOrigin();

  const started = await startPayment(code, token);
  if (!started.ok) {
    if (!started.order) return new NextResponse("找不到訂單", { status: 404 });
    const back = new URL(`/order/${code}`, origin);
    back.searchParams.set("t", token);
    back.searchParams.set("payerr", started.error);
    return NextResponse.redirect(back, 303);
  }

  const { settings } = await getStore();
  const cfg = payConfig(settings);
  const names = started.order.items.map((i) => i.name);
  const itemDesc = names.length > 1 ? `${names[0]} 等 ${names.length} 項` : names[0] ?? "Radiant 訂單";
  const form = buildMpgForm({
    cfg,
    orderNo: started.orderNo,
    amount: started.order.total,
    itemDesc: `Radiant ${itemDesc}`,
    returnUrl: `${origin}/api/payment/newebpay/return`,
    notifyUrl: `${origin}/api/payment/newebpay/notify`,
    clientBackUrl: `${origin}/order/${code}?t=${token}`,
  });
  const inputs = Object.entries(form.fields)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join("");
  const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>前往付款</title></head><body style="font-family:sans-serif;text-align:center;padding:64px 16px;color:#334"><p>正在前往藍新金流付款頁…</p><form id="pay" method="post" action="${esc(form.action)}">${inputs}<noscript><button type="submit">前往付款</button></noscript></form><script>document.getElementById("pay").submit()</script></body></html>`;
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
