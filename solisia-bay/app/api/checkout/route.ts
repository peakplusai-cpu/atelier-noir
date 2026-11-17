import { NextResponse } from "next/server";
import { getProduct, sizeLabel, validateSelection } from "@/lib/catalog";
import { COUNTRIES } from "@/lib/countries";
import { createCreemCheckout, creemConfigured } from "@/lib/creem";
import { shippingFor, toCents } from "@/lib/money";
import { createOrder, updateOrder, type OrderItem, StorageError } from "@/lib/orders";
import { siteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.");

  const email = text(body.email, 160).toLowerCase();
  const name = text(body.name, 100);
  const phone = text(body.phone, 40);
  const addr = (body.address ?? {}) as Record<string, unknown>;
  const address = {
    country: text(addr.country, 60),
    line1: text(addr.line1, 160),
    line2: text(addr.line2, 160),
    city: text(addr.city, 80),
    state: text(addr.state, 80),
    postalCode: text(addr.postalCode, 20),
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Please enter a valid email address.");
  if (!name) return fail("Please enter your full name.");
  if (!COUNTRIES.includes(address.country)) return fail("Please choose your country.");
  if (!address.line1 || !address.city || !address.postalCode) return fail("Please complete your shipping address.");

  const rawItems = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : [];
  if (rawItems.length === 0) return fail("Your bag is empty.");
  if (rawItems.length > 20) return fail("Too many items in your bag.");

  const items: OrderItem[] = [];
  for (const raw of rawItems) {
    const product = getProduct(text(raw.slug, 80));
    const color = text(raw.color, 40);
    const sizes = (raw.sizes && typeof raw.sizes === "object" ? raw.sizes : {}) as Record<string, string>;
    const qty = Math.floor(Number(raw.qty));
    if (!product || !validateSelection(product, color, sizes) || !Number.isFinite(qty) || qty < 1 || qty > 10) {
      return fail("Some items in your bag are no longer available. Please review your bag.", 409);
    }
    items.push({
      slug: product.slug,
      name: product.name,
      color,
      size: sizeLabel(product, sizes),
      unitPrice: product.price,
      qty,
    });
  }

  const subtotal = Math.round(items.reduce((s, i) => s + i.unitPrice * i.qty, 0) * 100) / 100;
  const shipping = shippingFor(subtotal);
  const total = Math.round((subtotal + shipping) * 100) / 100;
  const origin = siteOrigin();

  let order;
  try {
    order = await createOrder({ items, subtotal, shipping, total, email, name, phone, address });
  } catch (err) {
    if (err instanceof StorageError) {
      console.error("[checkout] storage error", err.message);
      return fail("We couldn't save your order right now. Please try again shortly.", 503);
    }
    throw err;
  }

  const successUrl = `${origin}/checkout/success?order=${encodeURIComponent(order.code)}&token=${order.token}`;

  if (!creemConfigured()) {
    if (process.env.NODE_ENV === "production") {
      await updateOrder(order.code, { status: "failed" });
      return fail("Payments are not configured yet. Please try again later.", 503);
    }
    // Local development without Creem credentials: simulate a successful payment.
    await updateOrder(order.code, {
      status: "paid",
      creemCheckoutId: "demo",
      amountPaidCents: toCents(total),
      paidAt: new Date().toISOString(),
    });
    return NextResponse.json({ url: successUrl, demo: true });
  }

  try {
    const checkout = await createCreemCheckout({
      requestId: order.code,
      amountCents: toCents(total),
      email,
      successUrl,
      metadata: { order_code: order.code },
    });
    await updateOrder(order.code, { creemCheckoutId: checkout.id });
    return NextResponse.json({ url: checkout.checkoutUrl });
  } catch (err) {
    console.error("[checkout] creem error", err instanceof Error ? err.message : err);
    await updateOrder(order.code, { status: "failed" });
    return fail("We couldn't start secure payment. Please try again in a moment.", 502);
  }
}
