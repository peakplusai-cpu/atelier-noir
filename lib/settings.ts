import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { supabaseAdmin, supabaseConfigured } from "./supabase";

export type SiteSettings = {
  /** Instagram username without @. Empty means the public button is hidden. */
  instagram: string;
};

const SETTINGS_PATH = join(process.cwd(), "data", "settings.json");

const EMPTY: SiteSettings = { instagram: "" };

export async function getSettings(): Promise<SiteSettings> {
  if (supabaseConfigured()) {
    try {
      const { data, error } = await supabaseAdmin()
        .from("site_settings")
        .select("instagram")
        .eq("id", 1)
        .maybeSingle();
      if (error || !data) return { ...EMPTY };
      return { instagram: String((data as { instagram?: string }).instagram ?? "") };
    } catch {
      return { ...EMPTY };
    }
  }
  if (!existsSync(SETTINGS_PATH)) return { ...EMPTY };
  try {
    const parsed = JSON.parse(readFileSync(SETTINGS_PATH, "utf8")) as Partial<SiteSettings>;
    return { instagram: String(parsed.instagram ?? "") };
  } catch {
    return { ...EMPTY };
  }
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  if (supabaseConfigured()) {
    const { error } = await supabaseAdmin()
      .from("site_settings")
      .upsert({ id: 1, instagram: settings.instagram, updated_at: new Date().toISOString() });
    if (error) throw error;
    return;
  }
  mkdirSync(dirname(SETTINGS_PATH), { recursive: true });
  const tmp = `${SETTINGS_PATH}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(settings, null, 2), "utf8");
  renameSync(tmp, SETTINGS_PATH);
}
