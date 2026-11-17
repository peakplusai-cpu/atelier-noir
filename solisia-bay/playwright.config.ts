import { defineConfig } from "@playwright/test";

const port = 3200;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "retain-on-failure" },
  webServer: {
    command: "npm run start -- --port 3200",
    port,
    reuseExistingServer: false,
    env: {
      ...process.env,
      SUPABASE_URL: "https://wgrwwuyxhdyakchuiubi.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "",
      PAYPAL_CLIENT_ID: "",
      PAYPAL_CLIENT_SECRET: "",
      STAFF_SETUP_TOKEN: "",
    },
  },
});
