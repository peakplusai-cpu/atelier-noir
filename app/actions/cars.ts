"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { uid } from "@/lib/id";
import { getStore, saveStore } from "@/lib/store";
import type { Car, CarStatus, Photo } from "@/lib/types";

async function requireAuth() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
}

function parseCar(formData: FormData, existing?: Car): Omit<Car, "id" | "createdAt"> {
  const make = String(formData.get("make") ?? "").trim();
  const makeEn = String(formData.get("makeEn") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const year = Number(formData.get("year") ?? 0);
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(requestedSlug || `${makeEn || make}-${model}-${year}`) || uid("car");
  const optionsRaw = String(formData.get("options") ?? "");
  const photoUrls = String(formData.get("photoUrls") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const photos: Photo[] = photoUrls.map((url, index) => ({
    id: existing?.photos[index]?.id ?? uid("ph"),
    url,
    alt: existing?.photos[index]?.alt || `${make} ${model}`,
  }));

  return {
    slug,
    make,
    makeEn,
    model,
    year,
    price: Number(formData.get("price") ?? 0),
    mileage: Number(formData.get("mileage") ?? 0),
    color: String(formData.get("color") ?? "").trim(),
    interior: String(formData.get("interior") ?? "").trim(),
    engine: String(formData.get("engine") ?? "").trim(),
    horsepower: Number(formData.get("horsepower") ?? 0),
    transmission: String(formData.get("transmission") ?? "").trim(),
    drivetrain: String(formData.get("drivetrain") ?? "").trim(),
    options: optionsRaw
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean),
    story: String(formData.get("story") ?? "").trim(),
    status: (String(formData.get("status") ?? "available") as CarStatus) || "available",
    published: formData.get("published") === "on" || formData.get("published") === "true",
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
    photos,
    updatedAt: new Date().toISOString(),
  };
}

export async function createCar(formData: FormData) {
  await requireAuth();
  const store = getStore();
  const parsed = parseCar(formData);
  if (store.cars.some((car) => car.slug === parsed.slug)) {
    parsed.slug = `${parsed.slug}-${uid("x").slice(-4)}`;
  }
  store.cars.unshift({
    ...parsed,
    id: uid("car"),
    createdAt: new Date().toISOString(),
  });
  saveStore(store);
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin/cars");
}

export async function updateCar(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const store = getStore();
  const index = store.cars.findIndex((car) => car.id === id);
  if (index === -1) redirect("/admin/cars");
  const existing = store.cars[index];
  const parsed = parseCar(formData, existing);
  if (store.cars.some((car) => car.slug === parsed.slug && car.id !== id)) {
    parsed.slug = `${parsed.slug}-${uid("x").slice(-4)}`;
  }
  store.cars[index] = {
    ...existing,
    ...parsed,
  };
  saveStore(store);
  revalidatePath("/");
  revalidatePath(`/cars/${parsed.slug}`);
  revalidatePath("/admin/cars");
  redirect("/admin/cars");
}

export async function togglePublish(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const store = getStore();
  const car = store.cars.find((item) => item.id === id);
  if (car) {
    car.published = !car.published;
    car.updatedAt = new Date().toISOString();
    saveStore(store);
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/cars");
}

export async function deleteCar(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const store = getStore();
  store.cars = store.cars.filter((car) => car.id !== id);
  saveStore(store);
  revalidatePath("/");
  revalidatePath("/admin/cars");
  redirect("/admin/cars");
}
