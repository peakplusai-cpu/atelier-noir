"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Rates } from "@/lib/currency";
import type { Market } from "@/lib/market";

export type MarketValue = Market & { rates: Rates };

const MarketContext = createContext<MarketValue | null>(null);

export function MarketProvider({ value, children }: { value: MarketValue; children: ReactNode }) {
  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketValue {
  const value = useContext(MarketContext);
  if (!value) throw new Error("useMarket must be used inside MarketProvider");
  return value;
}
