import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { parseDoors } from "./catalog";
import type { Admin, Car, Staff, Store } from "./types";
import { seedStore } from "./seed";
import { supabaseAdmin, supabaseConfigured } from "./supabase";
export { uid } from "./id";

const STORE_PATH = join(process.cwd(), "data", "store.json");
let jsonCache: Store | null = null;

function emptyStore(): Store {
  return { admin: null, staff: [], cars: [], sessions: [] };
}

function persistJson(store: Store): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  const tmp = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  renameSync(tmp, STORE_PATH);
}

function getJsonStore(): Store {
  if (jsonCache) return jsonCache;
  if (!existsSync(STORE_PATH)) {
    jsonCache = seedStore(emptyStore());
    persistJson(jsonCache);
    return jsonCache;
  }
  const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Store;
  jsonCache = {
    admin: parsed.admin ?? null,
    staff: parsed.staff ?? [],
    cars: (parsed.cars ?? []).map((car) => ({
      ...car,
      doors: parseDoors(car.doors),
    })),
    sessions: parsed.sessions ?? [],
  };
  return jsonCache;
}

function rowToStaff(row: Record<string, unknown>): Staff {
  return {
    id: String(row.id),
    displayName: String(row.display_name ?? ""),
    role: String(row.role ?? ""),
    lineUrl: String(row.line_url ?? ""),
    lineId: String(row.line_id ?? ""),
    note: String(row.note ?? ""),
    lineUserId: String(row.line_user_id ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? ""),
  };
}

function rowToCar(row: Record<string, unknown>): Car {
  return {
    id: String(row.id),
    slug: String(row.slug),
    make: String(row.make),
    makeEn: String(row.make_en ?? ""),
    model: String(row.model),
    year: Number(row.year),
    price: Number(row.price),
    mileage: Number(row.mileage ?? 0),
    color: String(row.color ?? ""),
    interior: String(row.interior ?? ""),
    engine: String(row.engine ?? ""),
    horsepower: Number(row.horsepower ?? 0),
    transmission: String(row.transmission ?? ""),
    drivetrain: String(row.drivetrain ?? ""),
    doors: parseDoors(row.doors),
    options: Array.isArray(row.options) ? (row.options as string[]) : [],
    story: String(row.story ?? ""),
    status: (row.status as Car["status"]) || "available",
    published: Boolean(row.published),
    featured: Boolean(row.featured),
    photos: Array.isArray(row.photos) ? (row.photos as Car["photos"]) : [],
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

async function getSupabaseStore(): Promise<Store> {
  const db = supabaseAdmin();
  const [adminRes, staffRes, carsRes] = await Promise.all([
    db.from("admin").select("*").eq("id", 1).maybeSingle(),
    db.from("staff").select("*").order("sort_order"),
    db.from("cars").select("*").order("created_at", { ascending: false }),
  ]);
  if (adminRes.error) throw adminRes.error;
  if (staffRes.error) throw staffRes.error;
  if (carsRes.error) throw carsRes.error;
  const adminRow = adminRes.data as { password_hash: string; created_at: string } | null;
  const admin: Admin | null = adminRow
    ? { passwordHash: adminRow.password_hash, createdAt: adminRow.created_at }
    : null;
  return {
    admin,
    staff: (staffRes.data ?? []).map((row) => rowToStaff(row as Record<string, unknown>)),
    cars: (carsRes.data ?? []).map((row) => rowToCar(row as Record<string, unknown>)),
    sessions: [],
  };
}

async function saveSupabaseStore(store: Store): Promise<void> {
  const db = supabaseAdmin();
  if (store.admin) {
    const { error } = await db.from("admin").upsert({
      id: 1,
      password_hash: store.admin.passwordHash,
      created_at: store.admin.createdAt,
    });
    if (error) throw error;
  }
  const { error: staffErr } = await db.from("staff").upsert(
    store.staff.map((person) => ({
      id: person.id,
      display_name: person.displayName,
      role: person.role,
      line_url: person.lineUrl,
      line_id: person.lineId,
      note: person.note,
      line_user_id: person.lineUserId,
      sort_order: person.sortOrder,
      created_at: person.createdAt,
    }))
  );
  if (staffErr) throw staffErr;
  const remoteStaff = await db.from("staff").select("id");
  const keepStaff = new Set(store.staff.map((s) => s.id));
  const extraStaff = (remoteStaff.data ?? []).map((r) => r.id).filter((id) => !keepStaff.has(id));
  if (extraStaff.length) await db.from("staff").delete().in("id", extraStaff);

  const { error: carsErr } = await db.from("cars").upsert(
    store.cars.map((car) => ({
      id: car.id,
      slug: car.slug,
      make: car.make,
      make_en: car.makeEn,
      model: car.model,
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      color: car.color,
      interior: car.interior,
      engine: car.engine,
      horsepower: car.horsepower,
      transmission: car.transmission,
      drivetrain: car.drivetrain,
      doors: car.doors,
      options: car.options,
      story: car.story,
      status: car.status,
      published: car.published,
      featured: car.featured,
      photos: car.photos,
      created_at: car.createdAt,
      updated_at: car.updatedAt,
    }))
  );
  if (carsErr) throw carsErr;
  const remoteCars = await db.from("cars").select("id");
  const keepCars = new Set(store.cars.map((c) => c.id));
  const extraCars = (remoteCars.data ?? []).map((r) => r.id).filter((id) => !keepCars.has(id));
  if (extraCars.length) await db.from("cars").delete().in("id", extraCars);
}

export async function getStore(): Promise<Store> {
  if (supabaseConfigured()) return getSupabaseStore();
  return getJsonStore();
}

export async function saveStore(store: Store): Promise<void> {
  if (supabaseConfigured()) {
    await saveSupabaseStore(store);
    return;
  }
  jsonCache = store;
  persistJson(store);
}
