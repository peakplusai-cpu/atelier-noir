import type { Store } from "./types";

export function seedStore(store: Store): Store {
  return {
    ...store,
    staff: [],
    cars: [],
  };
}
