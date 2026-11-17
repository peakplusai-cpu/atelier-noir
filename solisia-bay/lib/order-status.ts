export type OrderStatus = "pending" | "paid" | "shipped" | "completed" | "failed" | "cancelled" | "review";

/** Legal staff transitions. Payment capture is the only path into `paid`. */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["cancelled"],
  paid: ["shipped", "completed", "cancelled"],
  shipped: ["completed"],
  review: ["cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_TRANSITIONS;
}
