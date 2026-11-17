export function creemConfigured(): boolean {
  return Boolean(process.env.CREEM_API_KEY && process.env.CREEM_PRODUCT_ID);
}

function apiBase(): string {
  if (process.env.CREEM_API_BASE) return process.env.CREEM_API_BASE.replace(/\/$/, "");
  const key = process.env.CREEM_API_KEY ?? "";
  const env = (process.env.CREEM_ENV ?? "").toLowerCase();
  const test = env ? env === "test" : key.startsWith("creem_test_");
  return test ? "https://test-api.creem.io" : "https://api.creem.io";
}

export type CreemCheckout = { id: string; checkoutUrl: string };

export async function createCreemCheckout(input: {
  requestId: string;
  amountCents: number;
  email: string;
  successUrl: string;
  metadata: Record<string, string>;
}): Promise<CreemCheckout> {
  const res = await fetch(`${apiBase()}/v1/checkouts`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.CREEM_API_KEY! },
    body: JSON.stringify({
      product_id: process.env.CREEM_PRODUCT_ID,
      request_id: input.requestId,
      units: 1,
      custom_price: input.amountCents,
      customer: { email: input.email },
      success_url: input.successUrl,
      metadata: input.metadata,
    }),
    cache: "no-store",
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) {
    const message = typeof json.message === "string" ? json.message : Array.isArray(json.message) ? json.message.join("; ") : text.slice(0, 200);
    throw new Error(`Creem ${res.status}: ${message}`);
  }
  const checkoutUrl = typeof json.checkout_url === "string" ? json.checkout_url : "";
  const id = typeof json.id === "string" ? json.id : "";
  if (!checkoutUrl || !id) throw new Error("Creem did not return a checkout URL");
  return { id, checkoutUrl };
}
