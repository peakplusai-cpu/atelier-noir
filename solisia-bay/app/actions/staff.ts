"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createStaffSession, destroyStaffSession, isStaff, staffReady } from "@/lib/auth";
import { clientIpFrom } from "@/lib/guard";
import { canTransition, isOrderStatus } from "@/lib/order-status";
import { getOrder, isOrderCode, updateOrder, StorageError } from "@/lib/orders";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { safeEqualString } from "@/lib/secret";
import { getStaff, saveStaffPassword } from "@/lib/staff";

function text(form: FormData, key: string, max = 200): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function passwordValue(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== "string" || value.length < 8 || value.length > 128) return null;
  return value;
}

async function limited(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  const ip = clientIpFrom(await headers());
  return !rateLimit(`${bucket}:${ip}`, limit, windowMs).ok;
}

export async function setupStaff(_prev: string, form: FormData): Promise<string> {
  if (await limited("staff-setup", 5, 60 * 60 * 1000)) return "嘗試次數過多，請稍後再試";
  if (await staffReady()) redirect("/admin/login");
  const configured = process.env.STAFF_SETUP_TOKEN ?? "";
  if (configured) {
    const given = text(form, "setupToken", 500);
    if (given.length !== configured.length || !safeEqualString(given, configured)) return "設定代碼不正確";
  }
  const password = passwordValue(form, "password");
  const confirm = passwordValue(form, "confirm");
  if (!password) return "密碼需為 8 到 128 個字元";
  if (password !== confirm) return "兩次輸入的密碼不一致";
  try {
    const saved = await saveStaffPassword(await hashPassword(password));
    if (!saved) redirect("/admin/login");
  } catch (err) {
    if (err instanceof StorageError) return err.message;
    throw err;
  }
  await createStaffSession();
  redirect("/admin");
}

export async function loginStaff(_prev: string, form: FormData): Promise<string> {
  if (await limited("staff-login", 8, 15 * 60 * 1000)) return "嘗試次數過多，請 15 分鐘後再試";
  const staff = await getStaff();
  if (!staff.passwordHash) redirect("/admin/setup");
  const password = passwordValue(form, "password");
  const ok = password !== null && (await verifyPassword(password, staff.passwordHash));
  if (!ok) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return "密碼不正確";
  }
  await createStaffSession();
  redirect("/admin");
}

export async function logoutStaff(): Promise<void> {
  await destroyStaffSession();
  redirect("/admin/login");
}

export async function setOrderStatus(form: FormData): Promise<void> {
  if (!(await isStaff())) redirect("/admin/login");
  const code = text(form, "code", 40);
  const statusText = text(form, "status", 20);
  if (!isOrderCode(code) || !isOrderStatus(statusText)) redirect("/admin");
  const order = await getOrder(code);
  if (!order || !canTransition(order.status, statusText)) redirect(order ? `/admin/orders/${code}` : "/admin");
  try {
    await updateOrder(code, { status: statusText }, [order.status]);
  } catch (err) {
    if (err instanceof StorageError) console.error("[staff] status update failed", err.message);
    else throw err;
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${code}`);
  redirect(`/admin/orders/${code}`);
}
