import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const store = JSON.parse(readFileSync(join(root, "data", "store.json"), "utf8"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

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
console.log("seeded", store.cars.length, "cars", store.staff.length, "staff");
