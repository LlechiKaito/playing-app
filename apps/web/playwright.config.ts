import { defineConfig } from "@playwright/test";

const integration = process.env.INTEGRATION === "1";

export default defineConfig({
  testDir: integration ? "./tests/e2e-integration" : "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  timeout: integration ? 60_000 : 30_000,
  use: {
    baseURL: process.env.WEB_BASE_URL ?? "http://localhost:3000",
    trace: "off",
    headless: true,
  },
  webServer:
    integration || process.env.CI_NO_WEB_SERVER
      ? undefined
      : {
          command: "pnpm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 60_000,
        },
});
