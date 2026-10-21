import { mkdirSync } from "fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const MEDIA = "/cursor/stores/self/media";
const PASSWORD = "xuancang-atelier";

mkdirSync(MEDIA, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "zh-TW",
  deviceScaleFactor: 1,
});
const page = await context.newPage();
page.setDefaultTimeout(20000);

async function settle() {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(900);
}

async function shot(name) {
  await settle();
  const path = `${MEDIA}/${name}`;
  await page.screenshot({ path, fullPage: false });
  console.log("shot", path);
}

const log = [];

await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".hero h1");
await shot("home.png");
const homeMake = await page.locator(".hero h1").innerText();
const catalogCount = await page.locator(".catalog li").count();
log.push(`home hero=${homeMake} catalog=${catalogCount}`);

await page.goto(`${BASE}/cars/maybach-s680-nuit-2024`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".detail-title h1");
await shot("car-detail.png");
const detailMake = await page.locator(".detail-title h1").innerText();
const facts = await page.locator(".facts dd").count();
log.push(`detail hero=${detailMake} facts=${facts}`);

await page.click('a.btn:has-text("預約鑑賞")');
await page.waitForSelector(".pick");
await shot("inquiry-line.png");
const staffCount = await page.locator(".pick li").count();
const firstStaff = await page.locator(".pick .who").first().innerText();
log.push(`inquiry staff=${staffCount} first=${firstStaff}`);

const href = await page.evaluate(() => {
  const form = document.querySelector("form");
  form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  return document.querySelector('input[name="staff"]:checked')?.value || "";
});
log.push(`inquiry selected id present=${Boolean(href)}`);

await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('input[name="password"]');
const setupTitle = await page.locator("h1").innerText();
log.push(`admin gate=${setupTitle}`);
if (setupTitle.includes("設定密碼")) {
  await page.fill('input[name="password"]', PASSWORD);
  await page.fill('input[name="confirm"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/admin");
} else {
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/admin");
}

await page.waitForSelector("h1");
const deskTitle = await page.locator("h1").innerText();
log.push(`desk=${deskTitle}`);
await shot("admin.png");

await page.goto(`${BASE}/admin/cars/new`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="make"]', "測試");
await page.fill('input[name="makeEn"]', "Atelier");
await page.fill('input[name="model"]', "驗車 Prototype");
await page.fill('input[name="year"]', "2026");
await page.fill('input[name="price"]', "9900000");
await page.fill('input[name="mileage"]', "12");
await page.fill('input[name="color"]', "墨黑");
await page.fill('input[name="interior"]', "象牙");
await page.fill('input[name="engine"]', "4.0L V8");
await page.fill('input[name="horsepower"]', "580");
await page.fill('input[name="transmission"]', "八速自動");
await page.fill('input[name="drivetrain"]', "四輪驅動");
await page.fill('textarea[name="options"]', "夜視\n香氛");
await page.fill('textarea[name="story"]', "驗證用車輛，確認上架與下架流程。");
await page.fill('input[name="slug"]', "atelier-verify-prototype");
await page.fill(
  'textarea[name="photoUrls"]',
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2400&q=80"
);
await page.check('input[name="published"]');
const cookies = await context.cookies();
log.push(`cookies=${cookies.map((c) => c.name).join(",")}`);
await page.getByRole("button", { name: "儲存" }).click();
await page.waitForURL((url) => url.pathname === "/admin/cars");
log.push("created verify car");

await page.goto(`${BASE}/cars/atelier-verify-prototype`, { waitUntil: "domcontentloaded" });
const createdVisible = await page.locator("h1").innerText();
log.push(`public create=${createdVisible}`);
if (!createdVisible.includes("測試")) {
  throw new Error("created car not on public site");
}

await page.goto(`${BASE}/admin/cars`, { waitUntil: "domcontentloaded" });
const row = page.locator("tr", { hasText: "驗車 Prototype" });
await row.locator('button:has-text("下架")').click();
await page.waitForTimeout(600);
await page.goto(`${BASE}/cars/atelier-verify-prototype`, { waitUntil: "domcontentloaded" });
const unlistTitle = await page.locator("h1").innerText();
log.push(`after unlist=${unlistTitle}`);
if (!unlistTitle.includes("未公開") && !unlistTitle.includes("404")) {
  const status = await page.title();
  log.push(`unlist title=${status}`);
  if (!unlistTitle.includes("此車未公開")) {
    throw new Error("unlist did not hide car");
  }
}

await page.goto(`${BASE}/admin/cars`, { waitUntil: "domcontentloaded" });
const hiddenRow = page.locator("tr", { hasText: "驗車 Prototype" });
await hiddenRow.locator("a:has-text('編輯')").click();
await page.waitForSelector('input[name="model"]');
await page.fill('input[name="model"]', "驗車 Prototype 改");
await page.fill('input[name="color"]', "石墨");
await page.getByRole("button", { name: "儲存" }).click();
await page.waitForURL((url) => url.pathname === "/admin/cars");
await page.locator("tr", { hasText: "驗車 Prototype 改" }).locator('button:has-text("上架")').click();
await page.waitForTimeout(600);
await page.goto(`${BASE}/cars/atelier-verify-prototype`, { waitUntil: "domcontentloaded" });
const edited = await page.locator(".detail-title").innerText();
log.push(`after edit publish=${edited.replaceAll("\n", " / ")}`);
if (!edited.includes("驗車 Prototype 改")) {
  throw new Error("edit did not appear on public site");
}

await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await page.click('button:has-text("登出")');
await page.waitForURL((url) => url.pathname === "/admin/login");
log.push(`logout=${await page.locator("h1").innerText()}`);
await page.fill('input[name="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL((url) => url.pathname === "/admin");
log.push(`relogin=${await page.locator("h1").innerText()}`);

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "zh-TW",
  deviceScaleFactor: 2,
});
const mpage = await mobile.newPage();
await mpage.goto(BASE, { waitUntil: "domcontentloaded" });
await mpage.waitForSelector(".hero h1");
await mpage.waitForTimeout(800);
await mpage.screenshot({ path: `${MEDIA}/home-mobile.png` });
log.push("mobile home captured");
await mobile.close();

await browser.close();
console.log(JSON.stringify(log, null, 2));
console.log("PASSWORD_SET=" + PASSWORD);
