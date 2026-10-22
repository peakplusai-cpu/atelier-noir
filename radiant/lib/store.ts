import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { randomBytes } from "crypto";
import type { Settings, Store } from "./types";

const STORE_PATH = process.env.RADIANT_DATA_FILE || join(process.cwd(), "data", "store.json");

function defaultSettings(): Settings {
  return {
    secret: randomBytes(32).toString("hex"),
    shopName: "Radiant",
    tagline: "",
    announcement: "",
    shippingFee: 80,
    freeShippingThreshold: 1500,
    paymentNote: "送出訂單後，我們會透過 LINE 與您確認並提供付款方式。",
    lineOaName: "",
    lineOaBasicId: "",
    lineOaUrl: "",
    loginChannelId: "",
    loginChannelSecret: "",
    messagingToken: "",
    notifyTo: "",
  };
}

function persist(store: Store): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  const tmp = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  renameSync(tmp, STORE_PATH);
}

function read(): Store {
  if (!existsSync(STORE_PATH)) {
    const fresh: Store = {
      admin: null,
      settings: defaultSettings(),
      products: [],
      customers: [],
      orders: [],
    };
    persist(fresh);
    return fresh;
  }
  const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<Store>;
  const settings = { ...defaultSettings(), ...(parsed.settings ?? {}) };
  return {
    admin: parsed.admin ?? null,
    settings,
    products: parsed.products ?? [],
    customers: parsed.customers ?? [],
    orders: parsed.orders ?? [],
  };
}

export async function getStore(): Promise<Store> {
  return read();
}

const g = globalThis as { __radiantChain?: Promise<unknown> };

/**
 * Serialises every write. Each call reads a fresh copy from disk, so a thrown
 * error leaves the stored data untouched.
 */
export function mutate<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  const prev = g.__radiantChain ?? Promise.resolve();
  const run = prev.then(async () => {
    const draft = read();
    const result = await fn(draft);
    persist(draft);
    return result;
  });
  g.__radiantChain = run.catch(() => undefined);
  return run;
}
