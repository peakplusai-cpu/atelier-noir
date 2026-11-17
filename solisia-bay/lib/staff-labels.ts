import type { OrderStatus } from "./orders";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "待付款",
  paid: "已付款",
  shipped: "已出貨",
  completed: "已完成",
  failed: "付款失敗",
  cancelled: "已取消",
};

export const STATUS_ACTIONS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }[]>> = {
  pending: [{ status: "cancelled", label: "標記取消" }],
  paid: [
    { status: "shipped", label: "標記已出貨" },
    { status: "completed", label: "標記已完成" },
    { status: "cancelled", label: "標記取消" },
  ],
  shipped: [{ status: "completed", label: "標記已完成" }],
};
