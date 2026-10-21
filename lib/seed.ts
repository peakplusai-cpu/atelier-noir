import type { Staff, Store } from "./types";
import { uid } from "./id";

function now() {
  return new Date().toISOString();
}

function staffSeed(): Staff[] {
  const t = now();
  return [
    {
      id: uid("st"),
      displayName: "陳奕廷",
      role: "首席顧問",
      lineUrl: "https://line.me/ti/p/~atelier.chen",
      lineId: "atelier.chen",
      note: "夜間鑑賞與高訂配置",
      lineUserId: "",
      sortOrder: 1,
      createdAt: t,
    },
    {
      id: uid("st"),
      displayName: "林詩涵",
      role: "鑑賞專員",
      lineUrl: "https://line.me/ti/p/~atelier.lin",
      lineId: "atelier.lin",
      note: "新車入藏與試乘安排",
      lineUserId: "",
      sortOrder: 2,
      createdAt: t,
    },
    {
      id: uid("st"),
      displayName: "周子安",
      role: "交付顧問",
      lineUrl: "https://line.me/R/ti/p/@xuancang",
      lineId: "@xuancang",
      note: "交車、保險與託運",
      lineUserId: "",
      sortOrder: 3,
      createdAt: t,
    },
  ];
}

export function seedStore(store: Store): Store {
  return {
    ...store,
    staff: store.staff.length ? store.staff : staffSeed(),
    cars: [],
  };
}
