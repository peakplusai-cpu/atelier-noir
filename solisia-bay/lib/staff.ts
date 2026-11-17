import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { randomBytes } from "crypto";
import { supabaseAdmin, supabaseConfigured } from "./supabase";
import { StorageError } from "./orders";

export type StaffRecord = { passwordHash: string | null; secret: string };

const TABLE = "solisia_staff";
const FILE = process.env.SOLISIA_STAFF_FILE || join(process.cwd(), "data", "staff.json");

type Row = { password_hash: string | null; secret: string };

function readFile(): StaffRecord | null {
  if (!existsSync(FILE)) return null;
  const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Partial<StaffRecord>;
  if (!parsed.secret) return null;
  return { passwordHash: parsed.passwordHash ?? null, secret: parsed.secret };
}

function writeFile(record: StaffRecord): void {
  if (process.env.VERCEL) {
    throw new StorageError("員工帳號無法寫入 Vercel 磁碟。請設定 SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY，並執行 supabase/schema.sql。");
  }
  mkdirSync(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(record, null, 2), "utf8");
  renameSync(tmp, FILE);
}

async function readRow(): Promise<StaffRecord | null> {
  const { data, error } = await supabaseAdmin().from(TABLE).select("password_hash, secret").eq("id", 1).maybeSingle();
  if (error) throw new StorageError(`Could not read staff record: ${error.message}`);
  if (!data?.secret) return null;
  const row = data as Row;
  return { passwordHash: row.password_hash, secret: row.secret };
}

async function insertFresh(): Promise<void> {
  const secret = randomBytes(32).toString("hex");
  const { error } = await supabaseAdmin()
    .from(TABLE)
    .upsert({ id: 1, secret }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new StorageError(`Could not create staff record: ${error.message}`);
}

export async function getStaff(): Promise<StaffRecord> {
  if (supabaseConfigured()) {
    const existing = await readRow();
    if (existing) return existing;
    await insertFresh();
    return (await readRow()) ?? { passwordHash: null, secret: randomBytes(32).toString("hex") };
  }
  const existing = readFile();
  if (existing) return existing;
  const created = { passwordHash: null, secret: randomBytes(32).toString("hex") };
  writeFile(created);
  return created;
}

export async function saveStaffPassword(passwordHash: string): Promise<void> {
  if (supabaseConfigured()) {
    const current = await getStaff();
    const { error } = await supabaseAdmin()
      .from(TABLE)
      .update({ password_hash: passwordHash })
      .eq("id", 1)
      .eq("secret", current.secret);
    if (error) throw new StorageError(`Could not save staff password: ${error.message}`);
    return;
  }
  const current = await getStaff();
  writeFile({ ...current, passwordHash });
}
