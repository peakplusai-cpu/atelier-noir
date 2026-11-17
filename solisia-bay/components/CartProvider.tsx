"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sizeLabel, stockOf, validateSelection } from "@/lib/catalog";
import { finiteQty, lineKey, sanitizeCart, type CartLine } from "@/lib/cart-lines";
import { toCents } from "@/lib/money";
import { MAX_LINE_QTY } from "@/lib/pricing";
import { useCatalog } from "./CatalogProvider";

export type { CartLine };

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

const CartContext = createContext<CartContextValue | null>(null);

export { lineKey };

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalog();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(sanitizeCart(JSON.parse(raw), products));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, [products]);

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
      if (e.key !== STORAGE_KEY) return;
      if (!e.newValue) {
        setLines([]);
        return;
      }
      try {
        setLines(sanitizeCart(JSON.parse(e.newValue), products));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [products]);

  const add = useCallback((input: AddInput) => {
    const qty = finiteQty(input.qty ?? 1, 1);
    const product = products.find((item) => item.slug === input.slug);
    if (qty === null || qty < 1 || !product || !validateSelection(product, input.color, input.sizes)) return;
    const available = stockOf(product, input.color, sizeLabel(product, input.sizes));
    const key = lineKey(input.slug, input.color, input.sizes);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (available !== null && (existing?.qty ?? 0) + qty > available) return prev;
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_LINE_QTY, l.qty + qty) } : l));
      }
      return [...prev, { key, slug: input.slug, color: input.color, sizes: input.sizes, qty: Math.min(MAX_LINE_QTY, qty) }];
    });
    setIsOpen(true);
  }, [products]);

  const setQty = useCallback((key: string, qty: number) => {
    const next = finiteQty(qty, 0);
    setLines((prev) =>
      next === null || next <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_LINE_QTY, next) } : l))
    );
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((sum, l) => sum + toCents(products.find((item) => item.slug === l.slug)?.price ?? 0) * l.qty, 0) / 100;
    return { ready, lines, count, subtotal, isOpen, openCart, closeCart, add, setQty, remove, clear };
  }, [lines, products, ready, isOpen, openCart, closeCart, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
