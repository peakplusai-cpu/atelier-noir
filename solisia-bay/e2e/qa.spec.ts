import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const storageOrigin = "https://wgrwwuyxhdyakchuiubi.supabase.co";

test("security headers allow only this Supabase project for images", async ({ request }) => {
  const response = await request.get("/");
  const csp = response.headers()["content-security-policy"] ?? "";
  expect(csp).toContain(storageOrigin);
  expect(csp).not.toContain("*.supabase.co");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
});

test("a Supabase upload image is not blocked by CSP", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __violations: string[] }).__violations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { __violations: string[] }).__violations.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  await page.goto("/");
  await page.evaluate(async (origin) => {
    await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = `${origin}/storage/v1/object/public/solisia-uploads/missing.jpg`;
    });
  }, storageOrigin);
  const found = await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations);
  expect(found.filter((item) => item.includes("img-src"))).toEqual([]);
});

test("storefront browsing, cart and checkout validation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.goto("/collection/women?sort=price-asc");
  await expect(page.getByRole("heading", { name: /Women/ })).toBeVisible();
  await page.getByRole("link", { name: "Calista Triangle Bikini Top" }).first().click();
  await expect(page.getByRole("heading", { name: "Calista Triangle Bikini Top" })).toBeVisible();
  await page.getByRole("radio", { name: "S", exact: true }).click();
  await page.getByRole("button", { name: /Add to bag/ }).click();
  await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeVisible();
  await page.getByRole("link", { name: /Checkout/ }).click();
  await page.getByLabel("Email").fill("buyer@example.com");
  await page.getByLabel("Full name").fill("Ann Lee");
  await page.getByLabel("Country / region").selectOption("Taiwan");
  await page.getByLabel("地址 Address").fill("1 Harbor Road");
  await page.getByLabel("City").fill("Taipei");
  await page.getByLabel("Postal code").fill("100");
  await page.getByLabel("Gift code (optional)").fill("NOT-A-CODE");
  await page.getByRole("button", { name: /Continue to payment/ }).click();
  await expect(page.getByText("That code isn't valid.")).toBeVisible();
});

test("policies, missing pages, and order lookup do not leak", async ({ page, request }) => {
  await page.goto("/policies/shipping-returns");
  await expect(page.getByRole("heading", { name: "Shipping & Returns" })).toBeVisible();
  const missing = await page.goto("/products/not-a-real-dress");
  expect(missing?.status()).toBe(404);
  const order = await request.get("/api/orders/SB-000000-ABCDEF?token=00000000000000000000000000000000");
  expect(order.status()).toBe(404);
  const cross = await request.post("/api/checkout", {
    headers: { origin: "https://evil.example", host: "127.0.0.1:3200", "content-type": "application/json" },
    data: { items: [] },
  });
  expect(cross.status()).toBe(403);
  const upload = await request.post("/api/upload", {
    headers: { origin: "http://127.0.0.1:3200" },
    multipart: { file: { name: "x.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg></svg>") } },
  });
  expect(upload.status()).toBe(401);
});

test("the feed wall is a full-bleed marquee", async ({ page, request }) => {
  await request.get("/");
  await mkdir("data/uploads", { recursive: true });
  await copyFile("public/hero/pier.jpg", "data/uploads/pier-light.jpg");
  const shop = JSON.parse(await readFile("data/shop.json", "utf8")) as { wall: unknown[] };
  shop.wall = [
    { id: "wall_pier", image: "/media/pier-light.jpg", caption: "Pier light", slug: "calista-triangle-bikini-top", published: true, createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "wall_two", image: "/media/pier-light.jpg", caption: "Golden hour", slug: "", published: true, createdAt: "2026-01-02T00:00:00.000Z" },
  ];
  await writeFile("data/shop.json", JSON.stringify(shop));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const wall = page.getByRole("region", { name: "CLACK wall" });
  await wall.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>(".bay-wall-track").forEach((el) => {
      el.style.animationPlayState = "paused";
    });
  });
  await expect(wall).toBeVisible();
  const box = await wall.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(400);
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await page.screenshot({ path: "/opt/cursor/artifacts/solisia-wall-desktop.png", fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  await wall.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/opt/cursor/artifacts/solisia-wall-mobile.png", fullPage: false });
  const tile = wall.locator(".bay-wall-item").first();
  const tileBox = await tile.boundingBox();
  expect(tileBox?.height ?? 0).toBeGreaterThan(280);
  await tile.click();
  await expect(page).toHaveURL(/\/products\/calista-triangle-bikini-top/);
});

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("mobile pages stay on screen and the menu opens", async ({ page }) => {
  const { mkdir } = await import("node:fs/promises");
  await mkdir("/opt/cursor/artifacts/mobile-after", { recursive: true });
  const publicPaths = ["/", "/collection/women", "/collection/all", "/policies/shipping-returns", "/policies/size-guide", "/checkout", "/checkout/success", "/no-such-page"];
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of publicPaths) {
      await page.goto(path);
      await noHorizontalOverflow(page);
    }
    await page.goto("/collection/women");
    await page.getByRole("link", { name: "Calista Triangle Bikini Top" }).first().click();
    await expect(page.getByRole("heading", { name: "Calista Triangle Bikini Top" })).toBeVisible();
    await noHorizontalOverflow(page);
    if (width === 390) await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/product-390.png", fullPage: true });
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator(".mobile-nav[data-open='true']").getByRole("link", { name: "Women" })).toBeVisible();
    await noHorizontalOverflow(page);
    if (width === 390) await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/menu-390.png" });
    await page.getByRole("button", { name: "Close menu" }).click();
    await page.getByRole("radio", { name: "S", exact: true }).click();
    await page.getByRole("button", { name: /Add to bag/ }).click();
    await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeVisible();
    await noHorizontalOverflow(page);
    if (width === 390) await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/cart-390.png" });
    await page.getByRole("link", { name: /Checkout/ }).click();
    await expect(page.getByRole("button", { name: /Continue to payment/ })).toBeVisible();
    await noHorizontalOverflow(page);
    if (width === 390) await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/checkout-390.png", fullPage: true });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/home-390.png", fullPage: true });
  await page.goto("/collection/women");
  await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/collection-390.png", fullPage: false });
  await page.goto("/policies/shipping-returns");
  await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/policy-390.png", fullPage: false });
  await page.goto("/no-such-page");
  await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/missing-390.png", fullPage: false });
  await page.goto("/checkout/success");
  await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/success-390.png", fullPage: false });

  await page.goto("/admin/products");
  if (page.url().includes("/admin/setup")) {
    await page.getByLabel("設定密碼").fill("correct horse");
    await page.getByLabel("再次輸入").fill("correct horse");
    await page.getByRole("button", { name: "建立並進入後台" }).click();
  } else if (page.url().includes("/admin/login")) {
    await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/admin-login-390.png", fullPage: false });
    await page.getByLabel("密碼").fill("correct horse");
    await page.getByRole("button", { name: "登入" }).click();
  }
  await expect(page.getByRole("heading", { name: "總覽" })).toBeVisible();
  for (const path of ["/admin/products", "/admin/orders", "/admin/wall", "/admin/settings"]) {
    await page.goto(path);
    await noHorizontalOverflow(page);
  }
  await page.goto("/admin/products");
  await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/admin-products-390.png", fullPage: false });
  await page.getByRole("link", { name: "編輯" }).first().click();
  await expect(page.getByRole("heading", { name: "編輯商品" })).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/admin-product-edit-390.png", fullPage: false });
  await page.goto("/admin/wall");
  await page.screenshot({ path: "/opt/cursor/artifacts/mobile-after/admin-wall-390.png", fullPage: false });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/admin/orders");
  await noHorizontalOverflow(page);
  await page.setViewportSize({ width: 430, height: 900 });
  await page.goto("/admin/settings");
  await noHorizontalOverflow(page);
});

test("staff setup, settings, logout and login", async ({ page }) => {
  await page.goto("/admin/products");
  if (page.url().includes("/admin/setup")) {
    await page.getByLabel("設定密碼").fill("correct horse");
    await page.getByLabel("再次輸入").fill("correct horse");
    await page.getByRole("button", { name: "建立並進入後台" }).click();
  } else {
    await page.getByLabel("密碼").fill("correct horse");
    await page.getByRole("button", { name: "登入" }).click();
  }
  await expect(page.getByRole("heading", { name: "總覽" })).toBeVisible();
  await page.getByRole("link", { name: "設定" }).click();
  await page.getByLabel("公告列").fill("QA announcement for the bay");
  await page.getByRole("button", { name: "儲存設定" }).click();
  await expect(page.getByText("已儲存")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("QA announcement for the bay")).toBeVisible();
  await page.goto("/admin");
  await page.getByRole("button", { name: "登出" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("密碼").fill("wrong-password");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page.getByText("密碼不正確")).toBeVisible();
  await page.getByLabel("密碼").fill("correct horse");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page.getByRole("heading", { name: "總覽" })).toBeVisible();
});
