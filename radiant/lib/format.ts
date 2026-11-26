import type { Fulfillment, Order, OrderStatus } from "./types";
import { payTypeLabel } from "./newebpay";

export function formatPrice(n: number): string {
  return `NT$ ${Math.round(n).toLocaleString("en-US")}`;
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "待確認",
  paid: "已付款",
  shipped: "已出貨",
  completed: "已完成",
  cancelled: "已取消",
};

export const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "completed", "cancelled"];
export const OPEN_STATUSES: OrderStatus[] = ["pending", "paid"];

export function fulfillmentLabel(kind: Fulfillment | undefined): string {
  return kind === "pickup" ? "自取" : kind === "cvs" ? "超商取貨" : "宅配";
}

type PaymentFields = Pick<Order, "paymentMethod" | "paymentStatus" | "payType">;

export function paymentMethodLabel(method: PaymentFields["paymentMethod"]): string {
  return method === "online" ? "線上付款" : method === "cod" ? "超商取貨付款" : "LINE 確認付款";
}

export function paymentSummary(order: PaymentFields): string {
  if (order.paymentMethod === "online") {
    return order.paymentStatus === "paid" ? `已付款（${payTypeLabel(order.payType)}）` : "線上付款，尚未付款";
  }
  return paymentMethodLabel(order.paymentMethod);
}

export function fulfillmentSummary(order: Pick<Order, "fulfillment" | "address" | "pickupPointName">): string {
  if (order.fulfillment === "pickup") return `自取：${order.address || order.pickupPointName}`;
  if (order.fulfillment === "cvs") return `超商取貨：${order.address}`;
  return `宅配：${order.address}`;
}
