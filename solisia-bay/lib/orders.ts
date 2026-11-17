import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { randomBytes } from "crypto";
import { supabaseAdmin, supabaseConfigured } from "./supabase";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type OrderItem = {
  slug: string;
  name: string;
  color: string;
  size: string;
  unitPrice: number;
  qty: number;
};

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
};

const TABLE = "solisia_orders";
const FILE = process.env.SOLISIA_DATA_FILE || join(process.cwd(), "data", "orders.json");

export class StorageError extends Error {}

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
};

function fromRow(r: Row): Order {
  return {
    code: r.code,
    token: r.token,
    status: r.status,
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
  };
}

function readFileStore(): Order[] {
  if (!existsSync(FILE)) return [];
  return JSON.parse(readFileSync(FILE, "utf8")) as Order[];
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
  "items" | "subtotal" | "shipping" | "total" | "email" | "name" | "phone" | "address"
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
    if (error) throw new StorageError(`Could not save order: ${error.message}`);
    return order;
  }
  const all = readFileStore();
  all.push(order);
  writeFileStore(all);
  return order;
}

export async function getOrder(code: string): Promise<Order | null> {
  if (supabaseConfigured()) {
    const { data, error } = await supabaseAdmin().from(TABLE).select("*").eq("code", code).maybeSingle();
    if (error) throw new StorageError(`Could not read order: ${error.message}`);
    return data ? fromRow(data as Row) : null;
  }
  return readFileStore().find((o) => o.code === code) ?? null;
}

type Patch = Partial<Pick<Order, "status" | "paymentOrderId" | "paymentCaptureId" | "amountPaidCents" | "paidAt">>;

/**
 * Applies a patch. When `onlyFrom` is given the update only happens if the current status is in that list,
 * which makes webhook redelivery idempotent.
 */
export async function updateOrder(code: string, patch: Patch, onlyFrom?: OrderStatus[]): Promise<Order | null> {
  if (supabaseConfigured()) {
    const row: Partial<Row> = {};
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.paymentOrderId !== undefined) row.payment_order_id = patch.paymentOrderId;
    if (patch.paymentCaptureId !== undefined) row.payment_capture_id = patch.paymentCaptureId;
    if (patch.amountPaidCents !== undefined) row.amount_paid_cents = patch.amountPaidCents;
    if (patch.paidAt !== undefined) row.paid_at = patch.paidAt;
    let q = supabaseAdmin().from(TABLE).update(row).eq("code", code);
    if (onlyFrom) q = q.in("status", onlyFrom);
    const { data, error } = await q.select("*");
    if (error) throw new StorageError(`Could not update order: ${error.message}`);
    return data && data.length ? fromRow(data[0] as Row) : null;
  }
  const all = readFileStore();
  const order = all.find((o) => o.code === code);
  if (!order || (onlyFrom && !onlyFrom.includes(order.status))) return null;
  Object.assign(order, patch);
  writeFileStore(all);
  return order;
}
