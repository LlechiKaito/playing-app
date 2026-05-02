import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.WEB_BASE_URL ?? "http://localhost:3000",
    trace: "off",
    headless: true,
  },
  webServer: process.env.CI_NO_WEB_SERVER
    ? undefined
    : {
        command: "pnpm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
