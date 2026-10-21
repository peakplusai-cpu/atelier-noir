import { readFileSync, writeFileSync } from "fs";

const path = "/agent/data/store.json";
const store = JSON.parse(readFileSync(path, "utf8"));
const map = {
  "maybach-s680-nuit-2024": [
    ["/cars/maybach-s680.jpg", "夜空黑豪華房車"],
    ["/cars/maybach-dark.jpg", "夜間車頭"],
    ["/cars/harbor-gt.jpg", "港灣夜色"],
  ],
  "rolls-royce-ghost-2023": [
    ["/cars/rr-ghost.jpg", "雙色超豪華轎跑"],
    ["/cars/harbor-gt.jpg", "港灣靜止"],
    ["/cars/maybach-dark.jpg", "深色車頭"],
  ],
  "lamborghini-revuelto-2025": [
    ["/cars/lambo-flame.jpg", "林間超跑正面"],
    ["/cars/lambo-yellow.jpg", "硫磺色側面"],
    ["/cars/harbor-gt.jpg", "低趴車頭"],
  ],
  "ferrari-roma-2024": [
    ["/cars/ferrari-rosso.jpg", "羅馬紅 GT"],
    ["/cars/ferrari-roma.jpg", "黑色轎跑"],
    ["/cars/harbor-gt.jpg", "港灣線條"],
  ],
  "rolls-royce-cullinan-2022": [
    ["/cars/suv-noir.jpg", "墨晶黑豪華 SUV"],
    ["/cars/maybach-dark.jpg", "深色車頭"],
    ["/cars/night-fastback.jpg", "夜間車尾"],
  ],
  "lamborghini-urus-performante-2024": [
    ["/cars/harbor-gt.jpg", "石墨灰性能車"],
    ["/cars/suv-noir.jpg", "豪華 SUV"],
    ["/cars/lambo-flame.jpg", "銳角車頭"],
  ],
  "ferrari-purosangue-2024": [
    ["/cars/ferrari-roma.jpg", "金屬黑四門跑格"],
    ["/cars/harbor-gt.jpg", "港灣靜止"],
    ["/cars/night-fastback.jpg", "夜間車尾"],
  ],
};

for (const car of store.cars) {
  const photos = map[car.slug];
  if (!photos) continue;
  car.photos = photos.map(([url, alt], i) => ({
    id: car.photos[i]?.id || `ph_${i}_${car.slug}`,
    url,
    alt,
  }));
}
writeFileSync(path, JSON.stringify(store, null, 2));
console.log("patched", store.cars.length);
