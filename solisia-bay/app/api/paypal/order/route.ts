import { apiJson } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  return apiJson({ error: "付款已改由藍新金流處理。" }, 410);
}
