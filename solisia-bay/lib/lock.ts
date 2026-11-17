const tails = new Map<string, Promise<void>>();

/** Serializes read-modify-write on the local JSON stores inside one process. */
export function withLock<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
  const prev = tails.get(key) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  tails.set(
    key,
    run.then(
      () => undefined,
      () => undefined
    )
  );
  return run;
}
