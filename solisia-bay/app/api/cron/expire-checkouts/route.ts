import { apiJson } from "@/lib/api";
import { cronAuthStatus } from "@/lib/cron-auth";
import { expireAbandonedCheckouts } from "@/lib/expire-checkouts";

export const dynamic = "force-dynamic";

async function run(request: Request) {
  const auth = cronAuthStatus(request.headers.get("authorization"));
  if (auth === "unconfigured") return apiJson({ error: "Cron is not configured." }, 503);
  if (auth === "rejected") return apiJson({ error: "unauthorized" }, 401);
  try {
    const result = await expireAbandonedCheckouts();
    return apiJson({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] expire checkouts failed", err instanceof Error ? err.message : err);
    return apiJson({ error: "Could not expire abandoned checkouts." }, 500);
  }
}

export function GET(request: Request) {
  return run(request);
}

export function POST(request: Request) {
  return run(request);
}
