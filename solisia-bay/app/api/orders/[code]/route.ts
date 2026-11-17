import { apiJson } from "@/lib/api";
import { getOrder } from "@/lib/orders";
import { safeEqualString } from "@/lib/secret";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const order = await getOrder(code);
  if (!order || !safeEqualString(order.token, token)) return apiJson({ error: "not found" }, 404);
  return apiJson({ status: order.status });
}
