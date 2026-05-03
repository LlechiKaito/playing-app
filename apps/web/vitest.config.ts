import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/e2e/**", "tests/e2e-integration/**", "node_modules/**"],
    passWithNoTests: true,
  },
});
