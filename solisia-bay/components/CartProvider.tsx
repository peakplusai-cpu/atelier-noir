"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProduct } from "@/lib/catalog";

export type CartLine = {
  key: string;
  slug: string;
  color: string;
  sizes: Record<string, string>;
  qty: number;
};

type AddInput = { slug: string; color: string; sizes: Record<string, string>; qty?: number };

type CartContextValue = {
  ready: boolean;
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (input: AddInput) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "solisia-bay-cart-v1";
const MAX_QTY = 10;

const CartContext = createContext<CartContextValue | null>(null);

export function lineKey(slug: string, color: string, sizes: Record<string, string>): string {
  const sizePart = Object.keys(sizes)
    .sort()
    .map((k) => `${k}:${sizes[k]}`)
    .join(",");
  return `${slug}|${color}|${sizePart}`;
}

function sanitize(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const l = item as Partial<CartLine>;
    if (typeof l.slug !== "string" || typeof l.color !== "string" || !l.sizes || typeof l.sizes !== "object") continue;
    if (!getProduct(l.slug)) continue;
    const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(l.qty) || 1)));
    out.push({ key: lineKey(l.slug, l.color, l.sizes), slug: l.slug, color: l.color, sizes: l.sizes, qty });
  }
  return out;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(sanitize(JSON.parse(raw)));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines, ready]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setLines(sanitize(JSON.parse(e.newValue)));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((input: AddInput) => {
    const qty = Math.max(1, input.qty ?? 1);
    const key = lineKey(input.slug, input.color, input.sizes);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      }
      return [...prev, { key, slug: input.slug, color: input.color, sizes: input.sizes, qty: Math.min(MAX_QTY, qty) }];
    });
    setIsOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l))
    );
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal =
      Math.round(lines.reduce((sum, l) => sum + (getProduct(l.slug)?.price ?? 0) * l.qty, 0) * 100) / 100;
    return { ready, lines, count, subtotal, isOpen, openCart, closeCart, add, setQty, remove, clear };
  }, [lines, ready, isOpen, openCart, closeCart, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
