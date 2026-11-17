"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";

export default function PaymentStatus({ code, token, status }: { code: string; token: string; status: string }) {
  const router = useRouter();
  const { clear, ready } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    const settled = status === "paid" || status === "shipped" || status === "completed" || status === "review";
    if (ready && !cleared.current && settled) {
      cleared.current = true;
      clear();
    }
  }, [ready, status, clear]);

  useEffect(() => {
    if (status !== "pending") return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = (await res.json()) as { status?: string };
        if (data.status && data.status !== "pending") {
          clearInterval(timer);
          router.refresh();
        }
      } catch {
        /* retry */
      }
      if (tries >= 40) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
  }, [status, code, token, router]);

  return null;
}
