import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { randomBytes } from "crypto";
import { withLock } from "./lock";
import { isOrderStatus, type OrderStatus } from "./order-status";
import type { PricedItem } from "./pricing";
import { SITE } from "./site";
import { supabaseAdmin, supabaseConfigured } from "./supabase";

export type { OrderStatus } from "./order-status";
export type OrderItem = PricedItem;

export type ShippingAddress = {
  country: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

export type Order = {
  code: string;
  token: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  email: string;
  name: string;
  phone: string;
  address: ShippingAddress;
  paymentOrderId: string | null;
  paymentCaptureId: string | null;
  amountPaidCents: number | null;
  paidAt: string | null;
  createdAt: string;
  discount: number;
  coupon: string;
  promoId: string;
  stockHeld: boolean;
  shippingWaived: boolean;
  shipThreshold: number;
  shipFlat: number;
};

const TABLE = "solisia_orders";
const FILE = process.env.SOLISIA_DATA_FILE || join(process.cwd(), "data", "orders.json");
const CODE_RE = /^SB-\d{6}-[A-F0-9]{6}$/;

export class StorageError extends Error {}

export function isOrderCode(code: string): boolean {
  return CODE_RE.test(code);
}

type Row = {
  code: string;
  token: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number | string;
  shipping: number | string;
  total: number | string;
  currency: string;
  email: string;
  customer_name: string;
  phone: string;
  address: ShippingAddress;
  payment_order_id: string | null;
  payment_capture_id: string | null;
  amount_paid_cents: number | null;
  paid_at: string | null;
  created_at: string;
  meta?: Partial<Order> | null;
};

function metaOf(r: Row): Partial<Order> {
  return r.meta && typeof r.meta === "object" ? r.meta : {};
}

function fromRow(r: Row): Order {
  const status = isOrderStatus(r.status) ? r.status : "pending";
  const meta = metaOf(r);
  return {
    code: r.code,
    token: r.token,
    status,
    items: r.items,
    subtotal: Number(r.subtotal),
    shipping: Number(r.shipping),
    total: Number(r.total),
    currency: r.currency,
    email: r.email,
    name: r.customer_name,
    phone: r.phone,
    address: r.address,
    paymentOrderId: r.payment_order_id,
    paymentCaptureId: r.payment_capture_id,
    amountPaidCents: r.amount_paid_cents,
    paidAt: r.paid_at,
    createdAt: r.created_at,
    discount: Number(meta.discount ?? 0),
    coupon: typeof meta.coupon === "string" ? meta.coupon : "",
    promoId: typeof meta.promoId === "string" ? meta.promoId : "",
    stockHeld: Boolean(meta.stockHeld),
    shippingWaived: Boolean(meta.shippingWaived),
    shipThreshold: Number(meta.shipThreshold ?? SITE.freeShippingThreshold),
    shipFlat: Number(meta.shipFlat ?? SITE.flatShipping),
  };
}

function toRow(o: Order): Row {
  return {
    code: o.code,
    token: o.token,
    status: o.status,
    items: o.items,
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    currency: o.currency,
    email: o.email,
    customer_name: o.name,
    phone: o.phone,
    address: o.address,
    payment_order_id: o.paymentOrderId,
    payment_capture_id: o.paymentCaptureId,
    amount_paid_cents: o.amountPaidCents,
    paid_at: o.paidAt,
    created_at: o.createdAt,
    meta: {
      discount: o.discount,
      coupon: o.coupon,
      promoId: o.promoId,
      stockHeld: o.stockHeld,
      shippingWaived: o.shippingWaived,
      shipThreshold: o.shipThreshold,
      shipFlat: o.shipFlat,
    },
  };
}

function readFileStore(): Order[] {
  if (!existsSync(FILE)) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    throw new StorageError("Order file is unreadable.");
  }
  if (!Array.isArray(parsed)) throw new StorageError("Order file is unreadable.");
  return parsed as Order[];
}

function writeFileStore(orders: Order[]): void {
  if (process.env.VERCEL) {
    throw new StorageError("Orders cannot be stored on Vercel without Supabase. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  mkdirSync(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(orders, null, 2), "utf8");
  renameSync(tmp, FILE);
}

function newCode(): string {
  const d = new Date();
  const stamp = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `SB-${stamp}-${rand}`;
}

export type NewOrder = Pick<
  Order,
  | "items"
  | "subtotal"
  | "shipping"
  | "discount"
  | "total"
  | "email"
  | "name"
  | "phone"
  | "address"
  | "coupon"
  | "promoId"
  | "stockHeld"
  | "shippingWaived"
  | "shipThreshold"
  | "shipFlat"
>;

export async function createOrder(input: NewOrder): Promise<Order> {
  const order: Order = {
    ...input,
    code: newCode(),
    token: randomBytes(16).toString("hex"),
    status: "pending",
    currency: "USD",
    paymentOrderId: null,
    paymentCaptureId: null,
    amountPaidCents: null,
    paidAt: null,
    createdAt: new Date().toISOString(),
  };
  if (supabaseConfigured()) {
    const { error } = await supabaseAdmin().from(TABLE).insert(toRow(order));
    if (error) {
      const missing = /meta|schema cache|column/i.test(error.message);
      throw new StorageError(
        missing
          ? "訂單資料表還沒有 meta 欄位。請在 Supabase 執行 supabase/migrations/20261117_admin_store.sql。"
          : `Could not save order: ${error.message}`
      );
    }
    return order;
  }
  await withLock("orders", () => {
    const all = readFileStore();
    all.push(order);
    writeFileStore(all);
  });
  return order;
}

export async function listOrders(limit = 200): Promise<Order[]> {
  if (supabaseConfigured()) {
    const { data, error } = await supabaseAdmin()
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new StorageError(`Could not list orders: ${error.message}`);
    return ((data ?? []) as Row[]).map(fromRow);
  }
  return readFileStore()
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

export async function listStalePendingOrders(olderThanIso: string, limit = 50): Promise<Order[]> {
  if (supabaseConfigured()) {
    const { data, error } = await supabaseAdmin()
      .from(TABLE)
      .select("*")
      .eq("status", "pending")
      .lt("created_at", olderThanIso)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw new StorageError(`Could not list stale orders: ${error.message}`);
    return ((data ?? []) as Row[]).map(fromRow);
  }
  return readFileStore()
    .filter((order) => order.status === "pending" && order.createdAt < olderThanIso)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .slice(0, limit);
}

export async function getOrder(code: string): Promise<Order | null> {
  if (!isOrderCode(code)) return null;
  if (supabaseConfigured()) {
    const { data, error } = await supabaseAdmin().from(TABLE).select("*").eq("code", code).maybeSingle();
    if (error) throw new StorageError(`Could not read order: ${error.message}`);
    return data ? fromRow(data as Row) : null;
  }
  return readFileStore().find((order) => order.code === code) ?? null;
}

type Patch = Partial<
  Pick<Order, "status" | "paymentOrderId" | "paymentCaptureId" | "amountPaidCents" | "paidAt" | "stockHeld" | "discount" | "coupon" | "promoId" | "shippingWaived" | "shipThreshold" | "shipFlat">
>;

export type UpdateGuard = {
  /** Update only when payment_order_id is still empty, so two checkouts cannot replace each other. */
  requireUnsetPayment?: boolean;
  /** Update only when this order still holds reserved stock. */
  onlyIfStockHeld?: boolean;
};

/**
 * Applies a patch. When `onlyFrom` is given the update only happens if the current status is in that list.
 */
export async function updateOrder(code: string, patch: Patch, onlyFrom?: OrderStatus[], guard?: UpdateGuard): Promise<Order | null> {
  if (!isOrderCode(code)) return null;
  if (supabaseConfigured()) {
    const row: Partial<Row> = {};
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.paymentOrderId !== undefined) row.payment_order_id = patch.paymentOrderId;
    if (patch.paymentCaptureId !== undefined) row.payment_capture_id = patch.paymentCaptureId;
    if (patch.amountPaidCents !== undefined) row.amount_paid_cents = patch.amountPaidCents;
    if (patch.paidAt !== undefined) row.paid_at = patch.paidAt;
    if (
      patch.stockHeld !== undefined ||
      patch.discount !== undefined ||
      patch.coupon !== undefined ||
      patch.promoId !== undefined ||
      patch.shippingWaived !== undefined ||
      patch.shipThreshold !== undefined ||
      patch.shipFlat !== undefined
    ) {
      const current = await getOrder(code);
      row.meta = {
        discount: patch.discount ?? current?.discount ?? 0,
        coupon: patch.coupon ?? current?.coupon ?? "",
        promoId: patch.promoId ?? current?.promoId ?? "",
        stockHeld: patch.stockHeld ?? current?.stockHeld ?? false,
        shippingWaived: patch.shippingWaived ?? current?.shippingWaived ?? false,
        shipThreshold: patch.shipThreshold ?? current?.shipThreshold ?? SITE.freeShippingThreshold,
        shipFlat: patch.shipFlat ?? current?.shipFlat ?? SITE.flatShipping,
      };
    }
    let query = supabaseAdmin().from(TABLE).update(row).eq("code", code);
    if (onlyFrom) query = query.in("status", onlyFrom);
    if (guard?.requireUnsetPayment) query = query.is("payment_order_id", null);
    if (guard?.onlyIfStockHeld) query = query.contains("meta", { stockHeld: true });
    const { data, error } = await query.select("*");
    if (error) throw new StorageError(`Could not update order: ${error.message}`);
    return data && data.length ? fromRow(data[0] as Row) : null;
  }
  return withLock("orders", () => {
    const all = readFileStore();
    const order = all.find((item) => item.code === code);
    if (!order || (onlyFrom && !onlyFrom.includes(order.status))) return null;
    if (guard?.requireUnsetPayment && order.paymentOrderId) return null;
    if (guard?.onlyIfStockHeld && !order.stockHeld) return null;
    Object.assign(order, patch);
    writeFileStore(all);
    return order;
  });
}
