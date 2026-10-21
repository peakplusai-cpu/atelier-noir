import type { Car } from "./types";

export type DoorFilter = 2 | 4 | 0;

export type BrandOption = {
  id: string;
  label: string;
  aliases: string[];
};

export const HOUSE_BRANDS: BrandOption[] = [
  { id: "bmw", label: "BMW", aliases: ["bmw"] },
  { id: "mercedes", label: "賓士", aliases: ["mercedes", "benz", "賓士", "amg", "maybach"] },
  { id: "audi", label: "Audi", aliases: ["audi"] },
  { id: "porsche", label: "Porsche", aliases: ["porsche", "保時捷"] },
  { id: "ferrari", label: "Ferrari", aliases: ["ferrari", "法拉利"] },
  { id: "lamborghini", label: "Lamborghini", aliases: ["lamborghini", "藍寶堅尼"] },
  { id: "rolls-royce", label: "Rolls-Royce", aliases: ["rolls", "勞斯萊斯"] },
  { id: "bentley", label: "Bentley", aliases: ["bentley", "賓利"] },
  { id: "lexus", label: "Lexus", aliases: ["lexus"] },
  { id: "tesla", label: "Tesla", aliases: ["tesla"] },
];

export const PRICE_RANGES = [
  { id: "any", label: "不限", min: 0, max: Number.POSITIVE_INFINITY },
  { id: "u100", label: "100萬內", min: 0, max: 1_000_000 },
  { id: "100-300", label: "100–300萬", min: 1_000_000, max: 3_000_000 },
  { id: "300-600", label: "300–600萬", min: 3_000_000, max: 6_000_000 },
  { id: "600p", label: "600萬以上", min: 6_000_000, max: Number.POSITIVE_INFINITY },
] as const;

export function carMatchesBrand(car: Car, brand: BrandOption): boolean {
  const hay = `${car.make} ${car.makeEn}`.toLowerCase();
  return brand.aliases.some((alias) => hay.includes(alias.toLowerCase()));
}

export function brandOptions(cars: Car[]): BrandOption[] {
  if (!cars.length) return HOUSE_BRANDS;
  const present = HOUSE_BRANDS.filter((brand) => cars.some((car) => carMatchesBrand(car, brand)));
  const extras: BrandOption[] = [];
  for (const car of cars) {
    if (HOUSE_BRANDS.some((brand) => carMatchesBrand(car, brand))) continue;
    const label = car.make.trim();
    if (!label || extras.some((item) => item.label === label)) continue;
    extras.push({ id: `x-${label}`, label, aliases: [label] });
  }
  return [...present, ...extras];
}

export function filterCars(
  cars: Car[],
  brandId: string,
  doors: DoorFilter,
  priceId: string
): Car[] {
  const brands = brandOptions(cars);
  const brand = brandId ? brands.find((item) => item.id === brandId) : undefined;
  const range = PRICE_RANGES.find((item) => item.id === priceId) ?? PRICE_RANGES[0];
  return cars.filter((car) => {
    if (brand && !carMatchesBrand(car, brand)) return false;
    if (doors && car.doors !== doors) return false;
    if (car.price < range.min || car.price >= range.max) return false;
    return true;
  });
}

export function parseDoors(value: unknown): 2 | 4 {
  return Number(value) === 2 ? 2 : 4;
}
