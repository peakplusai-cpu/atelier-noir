"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ShopSettings } from "@/lib/shop-public";
import type { Product } from "@/lib/types";

type CatalogValue = { products: Product[]; settings: ShopSettings };

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({ value, children }: { value: CatalogValue; children: ReactNode }) {
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}
