"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { parseInstagram } from "@/lib/instagram";
import { getSettings, saveSettings } from "@/lib/settings";

export async function saveInstagram(formData: FormData) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const parsed = parseInstagram(String(formData.get("instagram") ?? ""));
  if (!parsed.ok) redirect("/admin/settings?error=instagram");

  const current = await getSettings();
  try {
    await saveSettings({ ...current, instagram: parsed.username });
  } catch {
    redirect("/admin/settings?error=save");
  }
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
