import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { Store } from "./types";
import { seedStore } from "./seed";
export { uid } from "./id";

const STORE_PATH = join(process.cwd(), "data", "store.json");

let cache: Store | null = null;

function emptyStore(): Store {
  return { admin: null, staff: [], cars: [], sessions: [] };
}

function persist(store: Store): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  const tmp = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  renameSync(tmp, STORE_PATH);
}

export function getStore(): Store {
  if (cache) return cache;
  if (!existsSync(STORE_PATH)) {
    cache = seedStore(emptyStore());
    persist(cache);
    return cache;
  }
  const raw = readFileSync(STORE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Store;
  cache = {
    admin: parsed.admin ?? null,
    staff: parsed.staff ?? [],
    cars: parsed.cars ?? [],
    sessions: parsed.sessions ?? [],
  };
  return cache;
}

export function saveStore(store: Store): void {
  cache = store;
  persist(store);
}
