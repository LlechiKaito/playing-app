import { test, expect } from "@playwright/test";

test("home page renders title and login link", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /カラオケ対戦/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "ログイン" })).toBeVisible();
});

test("/mypage redirects to /login when unauthenticated", async ({ page }) => {
  await page.goto("/mypage");
  await page.waitForURL(/\/login/);
});
