/** Simulated capture is only for a local, non-Vercel process. */
export function demoPaymentsAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1";
}
