type Hit = { at: number };

const buckets = new Map<string, Hit[]>();

export function resetRateLimits(): void {
  buckets.clear();
}

/** In-memory window. On serverless this is per instance, not a global lockout. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfterSec: number } {
  const prev = (buckets.get(key) ?? []).filter((hit) => now - hit.at < windowMs);
  if (prev.length >= limit) {
    buckets.set(key, prev);
    const retryAfterSec = Math.max(1, Math.ceil((prev[0].at + windowMs - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  prev.push({ at: now });
  buckets.set(key, prev);
  if (buckets.size > 4000) {
    const oldest = buckets.keys().next().value;
    if (oldest) buckets.delete(oldest);
  }
  return { ok: true, retryAfterSec: 0 };
}
