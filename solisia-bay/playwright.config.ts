import { defineConfig } from "@playwright/test";

const port = 3200;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "retain-on-failure" },
  webServer: {
    command: "rm -rf .e2e-data && mkdir -p .e2e-data && npm run start -- --port 3200",
    port,
    reuseExistingServer: false,
    env: {
      ...process.env,
      SUPABASE_URL: "https://wgrwwuyxhdyakchuiubi.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "",
      PAYPAL_CLIENT_ID: "",
      PAYPAL_CLIENT_SECRET: "",
      STAFF_SETUP_TOKEN: "",
      SOLISIA_SHOP_FILE: ".e2e-data/shop.json",
      SOLISIA_DATA_FILE: ".e2e-data/orders.json",
      SOLISIA_STAFF_FILE: ".e2e-data/staff.json",
    },
  },
});
