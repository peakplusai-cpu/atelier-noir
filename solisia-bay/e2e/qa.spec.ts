import { expect, test } from "@playwright/test";

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
  await page.getByLabel("Address", { exact: true }).fill("1 Harbor Road");
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
