import { randomBytes } from "crypto";
import { getStore, mutate } from "./store";
import { uid } from "./id";
import { variantPrice } from "./products";
import { formatPrice, fulfillmentSummary, paymentSummary } from "./format";
import { pushLine } from "./line";
import { enabledPickupPoints, formatPickupAddress } from "./pickup";
import { CVS_BRANDS } from "./cvs";
import { merchantOrderNo, orderCodeFromMerchantNo, payConfig, type PayResult } from "./newebpay";
import { safeEqual } from "./auth";
import type { Customer, Fulfillment, Order, OrderItem, OrderStatus, PaymentMethod, Store } from "./types";

export type CartLine = { productId: string; variantId: string; qty: number };

export type CheckoutInput = {
  lines: CartLine[];
  recipient: string;
  phone: string;
  address: string;
  fulfillment: Fulfillment;
  pickupPointId: string;
  cvsBrand: string;
  cvsStoreName: string;
  cvsStoreCode: string;
  paymentMethod: PaymentMethod;
  note: string;
  identity: { lineUserId: string; lineName: string; lineId: string; verified: boolean };
};

class OrderError extends Error {}

const DAY = 24 * 60 * 60 * 1000;

function upsertCustomer(store: Store, id: CheckoutInput["identity"]): Customer {
  const now = new Date().toISOString();
  const idKey = id.lineId.trim().toLowerCase();
  let customer: Customer | undefined;

  if (id.lineUserId) {
    customer = store.customers.find((c) => c.lineUserId === id.lineUserId);
    if (!customer && idKey) {
      customer = store.customers.find((c) => !c.lineUserId && c.lineId.toLowerCase() === idKey);
    }
  } else if (idKey) {
    customer = store.customers.find((c) => c.lineId.toLowerCase() === idKey);
  }

  if (!customer) {
    customer = {
      id: uid("cus"),
      lineUserId: id.lineUserId,
      lineName: id.lineName,
      lineId: id.lineId.trim(),
      verified: id.verified,
      note: "",
      createdAt: now,
      lastOrderAt: now,
    };
    store.customers.push(customer);
    return customer;
  }

  if (id.lineUserId) {
    customer.lineUserId = id.lineUserId;
    customer.verified = true;
  }
  if (id.lineName) customer.lineName = id.lineName;
  if (id.lineId.trim()) customer.lineId = id.lineId.trim();
  customer.lastOrderAt = now;
  return customer;
}

function newCode(store: Store): string {
  const d = new Date(Date.now() + 8 * 3600_000);
  const stamp = d.toISOString().slice(2, 10).replace(/-/g, "");
  for (;;) {
    const code = `RD${stamp}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    if (!store.orders.some((o) => o.code === code)) return code;
  }
}

function restoreStock(store: Store, order: Order): void {
  for (const item of order.items) {
    const product = store.products.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (variant) variant.stock += item.qty;
    if (product) product.sold = Math.max(0, product.sold - item.qty);
  }
}

export type ExpiredEntry = { order: Order; customer: Customer | undefined };

export function isExpiredUnpaid(order: Order, days: number, now: number): boolean {
  if (days <= 0 || order.status !== "pending" || order.paymentStatus === "paid") return false;
  if (order.paymentMethod === "cod") return false;
  return new Date(order.createdAt).getTime() + days * DAY <= now;
}

export function expireStale(store: Store, now = Date.now()): ExpiredEntry[] {
  const days = store.settings.unpaidCancelDays;
  const out: ExpiredEntry[] = [];
  for (const order of store.orders) {
    if (!isExpiredUnpaid(order, days, now)) continue;
    restoreStock(store, order);
    order.status = "cancelled";
    order.internalNote = [order.internalNote, `系統：超過 ${days} 天未付款，自動取消`].filter(Boolean).join("\n");
    order.updatedAt = new Date(now).toISOString();
    out.push({ order, customer: store.customers.find((c) => c.id === order.customerId) });
  }
  return out;
}

function notifyExpired(entries: ExpiredEntry[], notifyTo: string, days: number): void {
  if (!entries.length) return;
  const codes = entries.map((e) => e.order.code).join("、");
  void pushLine(notifyTo, `${entries.length} 張訂單超過 ${days} 天未付款，已自動取消並釋出庫存：\n${codes}`);
  for (const { order, customer } of entries) {
    if (!customer?.lineUserId) continue;
    const lines = order.items.map((i) => `· ${i.name} ${i.color} × ${i.qty}`).join("\n");
    void pushLine(
      customer.lineUserId,
      `您的 Radiant 訂單 ${order.code} 因超過 ${days} 天未完成付款，已自動取消。\n${lines}\n如仍需要，歡迎重新下單。`
    );
  }
}

export async function sweepExpiredOrders(): Promise<number> {
  const { orders, settings } = await getStore();
  const now = Date.now();
  if (!orders.some((o) => isExpiredUnpaid(o, settings.unpaidCancelDays, now))) return 0;
  const result = await mutate((store) => ({
    entries: expireStale(store, now),
    notifyTo: store.settings.notifyTo,
    days: store.settings.unpaidCancelDays,
  }));
  notifyExpired(result.entries, result.notifyTo, result.days);
  return result.entries.length;
}

export async function placeOrder(
  input: CheckoutInput
): Promise<{ ok: true; order: Order; customer: Customer } | { ok: false; error: string }> {
  try {
    const result = await mutate((store) => {
      const expired = expireStale(store);

      const merged = new Map<string, CartLine>();
      for (const line of input.lines) {
        const qty = Math.floor(Number(line.qty));
        if (!Number.isFinite(qty) || qty < 1) throw new OrderError("數量不正確");
        const key = `${line.productId}:${line.variantId}`;
        const prev = merged.get(key);
        merged.set(key, { ...line, qty: (prev?.qty ?? 0) + qty });
      }
      if (!merged.size) throw new OrderError("購物袋是空的");

      const { settings } = store;
      if (input.fulfillment === "cvs" && !settings.cvsEnabled) throw new OrderError("目前未開放超商取貨");
      if (input.paymentMethod === "online" && !payConfig(settings).ready) throw new OrderError("線上付款目前未開放");
      if (input.paymentMethod === "cod" && !(input.fulfillment === "cvs" && settings.cvsCodEnabled)) {
        throw new OrderError("取貨付款僅限超商取貨");
      }

      const items: OrderItem[] = [];
      for (const line of merged.values()) {
        const product = store.products.find((p) => p.id === line.productId);
        if (!product || product.status !== "listed") throw new OrderError("部分商品已下架");
        const variant = product.variants.find((v) => v.id === line.variantId);
        if (!variant) throw new OrderError(`${product.name} 的款式已不存在`);
        if (variant.stock < line.qty) {
          throw new OrderError(`${product.name}（${variant.color}）庫存不足，目前剩 ${Math.max(0, variant.stock)} 件`);
        }
        variant.stock -= line.qty;
        product.sold += line.qty;
        items.push({
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          color: variant.color,
          hex: variant.hex,
          price: variantPrice(product, variant),
          qty: line.qty,
          photo: product.photos[0] ?? "",
        });
      }

      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      let shipping = 0;
      let address = input.address;
      let pickupPointId = "";
      let pickupPointName = "";
      let cvsBrand = "";
      let cvsStoreName = "";
      let cvsStoreCode = "";

      if (input.fulfillment === "pickup") {
        const point = enabledPickupPoints(settings).find((p) => p.id === input.pickupPointId);
        if (!point) throw new OrderError("請選擇有效的自取地點");
        pickupPointId = point.id;
        pickupPointName = point.name;
        address = formatPickupAddress(point);
      } else {
        if (input.fulfillment === "cvs") {
          if (!CVS_BRANDS.includes(input.cvsBrand)) throw new OrderError("請選擇超商品牌");
          if (!input.cvsStoreName || !input.cvsStoreCode) throw new OrderError("請填寫門市名稱與店號");
          cvsBrand = input.cvsBrand;
          cvsStoreName = input.cvsStoreName;
          cvsStoreCode = input.cvsStoreCode;
          address = `${cvsBrand} ${cvsStoreName}（店號 ${cvsStoreCode}）`;
        }
        const { shippingFee, freeShippingThreshold } = settings;
        shipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : shippingFee;
      }

      const customer = upsertCustomer(store, input.identity);
      const now = new Date().toISOString();
      const order: Order = {
        id: uid("ord"),
        code: newCode(store),
        token: randomBytes(12).toString("hex"),
        customerId: customer.id,
        recipient: input.recipient,
        phone: input.phone,
        address,
        fulfillment: input.fulfillment,
        pickupPointId,
        pickupPointName,
        cvsBrand,
        cvsStoreName,
        cvsStoreCode,
        paymentMethod: input.paymentMethod,
        paymentStatus: "unpaid",
        payType: "",
        payTradeNo: "",
        paidAt: "",
        payAttempts: 0,
        note: input.note,
        items,
        subtotal,
        shipping,
        total: subtotal + shipping,
        status: "pending",
        internalNote: "",
        createdAt: now,
        updatedAt: now,
      };
      store.orders.push(order);
      const priorOrders = store.orders.filter((o) => o.customerId === customer.id && o.id !== order.id).length;
      return {
        order,
        customer,
        priorOrders,
        expired,
        notifyTo: store.settings.notifyTo,
        days: store.settings.unpaidCancelDays,
      };
    });

    notifyExpired(result.expired, result.notifyTo, result.days);

    const { order, customer } = result;
    const lines = order.items.map((i) => `· ${i.name} ${i.color} × ${i.qty}`).join("\n");
    const how = fulfillmentSummary(order);
    const pay = paymentSummary(order);
    const shopMsg =
      `新訂單 ${order.code}\n` +
      `${customer.lineName}${customer.lineId ? `（${customer.lineId}）` : ""}\n` +
      `${order.recipient} ${order.phone}\n` +
      `${how}\n付款：${pay}` +
      `${result.priorOrders > 0 ? `\n此客戶累計第 ${result.priorOrders + 1} 張單，請合併處理` : ""}\n` +
      `${lines}\n合計 ${formatPrice(order.total)}`;
    void pushLine(result.notifyTo, shopMsg);
    if (customer.lineUserId) {
      const follow = order.paymentMethod === "online" ? "請於訂單頁完成線上付款。" : "我們會盡快與您確認。";
      void pushLine(
        customer.lineUserId,
        `Radiant 已收到您的訂單 ${order.code}\n${how}\n${lines}\n合計 ${formatPrice(order.total)}\n${follow}`
      );
    }
    return { ok: true, order, customer };
  } catch (err) {
    if (err instanceof OrderError) return { ok: false, error: err.message };
    throw err;
  }
}

export async function changeOrder(
  id: string,
  status: OrderStatus,
  internalNote: string
): Promise<{ ok: boolean; error?: string; order?: Order; stockRestored?: boolean; customer?: Customer }> {
  return mutate((store) => {
    const order = store.orders.find((o) => o.id === id);
    if (!order) return { ok: false, error: "找不到訂單" };
    if (order.status === "cancelled" && status !== "cancelled") {
      return { ok: false, error: "已取消的訂單無法恢復" };
    }
    if (order.status === "completed" && status === "cancelled") {
      return { ok: false, error: "已完成的訂單無法取消" };
    }
    let stockRestored = false;
    if (status === "cancelled" && order.status !== "cancelled") {
      restoreStock(store, order);
      stockRestored = true;
    }
    if (status === "paid" && order.paymentMethod === "online" && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.payType = "MANUAL";
      order.paidAt = new Date().toISOString();
    }
    order.status = status;
    order.internalNote = internalNote;
    order.updatedAt = new Date().toISOString();
    const customer = store.customers.find((c) => c.id === order.customerId);
    return { ok: true, order, stockRestored, customer };
  });
}

export type StartPayment =
  | { ok: true; order: Order; orderNo: string }
  | { ok: false; error: string; order?: Order };

export async function startPayment(code: string, token: string): Promise<StartPayment> {
  return mutate((store): StartPayment => {
    const order = store.orders.find((o) => o.code === code);
    if (!order || !safeEqual(token, order.token)) return { ok: false, error: "找不到訂單" };
    if (order.paymentMethod !== "online") return { ok: false, error: "此訂單不是線上付款", order };
    if (order.paymentStatus === "paid") return { ok: false, error: "此訂單已付款", order };
    if (order.status !== "pending") return { ok: false, error: "此訂單已無法付款", order };
    if (!payConfig(store.settings).ready) return { ok: false, error: "線上付款目前未開放", order };
    order.payAttempts += 1;
    order.updatedAt = new Date().toISOString();
    return { ok: true, order: { ...order }, orderNo: merchantOrderNo(order.code, order.payAttempts) };
  });
}

export type PaymentOutcome =
  | { kind: "unknown" }
  | { kind: "failed"; order: Order }
  | { kind: "amount_mismatch"; order: Order }
  | { kind: "duplicate"; order: Order }
  | { kind: "paid" | "late"; order: Order; customer: Customer | undefined; notifyTo: string };

export async function recordPayment(result: PayResult): Promise<PaymentOutcome> {
  const code = orderCodeFromMerchantNo(result.merchantOrderNo);
  const outcome = await mutate((store): PaymentOutcome => {
    const order = store.orders.find((o) => o.code === code);
    if (!order || order.paymentMethod !== "online") return { kind: "unknown" };
    if (!result.ok) return { kind: "failed", order: { ...order } };
    if (!Number.isFinite(result.amount) || Math.round(result.amount) !== order.total) {
      return { kind: "amount_mismatch", order: { ...order } };
    }
    if (order.paymentStatus === "paid") return { kind: "duplicate", order: { ...order } };
    const now = new Date().toISOString();
    order.paymentStatus = "paid";
    order.payType = result.payType;
    order.payTradeNo = result.tradeNo;
    order.paidAt = now;
    const late = order.status === "cancelled";
    if (late) {
      order.internalNote = [order.internalNote, "系統：訂單已取消後才收到付款，請至藍新後台退款"].filter(Boolean).join("\n");
    } else if (order.status === "pending") {
      order.status = "paid";
    }
    order.updatedAt = now;
    return {
      kind: late ? "late" : "paid",
      order: { ...order },
      customer: store.customers.find((c) => c.id === order.customerId),
      notifyTo: store.settings.notifyTo,
    };
  });

  if (outcome.kind === "paid" || outcome.kind === "late") {
    const { order, customer, notifyTo } = outcome;
    const who = customer ? `${customer.lineName}${customer.lineId ? `（${customer.lineId}）` : ""}` : "";
    if (outcome.kind === "late") {
      void pushLine(
        notifyTo,
        `注意：訂單 ${order.code} 已取消，但收到線上付款 ${formatPrice(order.total)}\n${who}\n請至藍新金流後台退款。`
      );
    } else {
      void pushLine(notifyTo, `訂單 ${order.code} 已收到線上付款 ${formatPrice(order.total)}\n${who}\n${paymentSummary(order)}`);
      if (customer?.lineUserId) {
        void pushLine(customer.lineUserId, `Radiant 已收到您的付款（訂單 ${order.code}，${formatPrice(order.total)}）。我們會盡快為您處理，謝謝。`);
      }
    }
  }
  return outcome;
}
