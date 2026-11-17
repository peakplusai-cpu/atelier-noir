"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createStaffSession,
  destroyStaffSession,
  hashPassword,
  isStaff,
  staffReady,
  verifyPassword,
} from "@/lib/auth";
import { getOrder, updateOrder, type OrderStatus, StorageError } from "@/lib/orders";
import { getStaff, saveStaffPassword } from "@/lib/staff";

function text(form: FormData, key: string, max = 200): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function setupStaff(_prev: string, form: FormData): Promise<string> {
  if (await staffReady()) redirect("/admin/login");
  const password = text(form, "password");
  if (password.length < 8) return "密碼至少需要 8 個字元";
  if (password !== text(form, "confirm")) return "兩次輸入的密碼不一致";
  try {
    await saveStaffPassword(hashPassword(password));
  } catch (err) {
    if (err instanceof StorageError) return err.message;
    throw err;
  }
  await createStaffSession();
  redirect("/admin");
}

export async function loginStaff(_prev: string, form: FormData): Promise<string> {
  const staff = await getStaff();
  if (!staff.passwordHash) redirect("/admin/setup");
  const ok = verifyPassword(text(form, "password"), staff.passwordHash);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 700));
    return "密碼不正確";
  }
  await createStaffSession();
  redirect("/admin");
}

export async function logoutStaff(): Promise<void> {
  await destroyStaffSession();
  redirect("/admin/login");
}

const NEXT: Record<string, OrderStatus[]> = {
  pending: ["cancelled"],
  paid: ["shipped", "completed", "cancelled"],
  shipped: ["completed"],
};

export async function setOrderStatus(form: FormData): Promise<void> {
  if (!(await isStaff())) redirect("/admin/login");
  const code = text(form, "code", 40);
  const status = text(form, "status", 20) as OrderStatus;
  const order = await getOrder(code);
  if (!order) redirect("/admin");
  const allowed = NEXT[order.status] ?? [];
  if (!allowed.includes(status)) redirect(`/admin/orders/${code}`);
  await updateOrder(code, { status }, [order.status]);
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${code}`);
  redirect(`/admin/orders/${code}`);
}
