import { test, expect, type Page } from "@playwright/test";

const RUN_ID = Date.now().toString(36);

async function signup(page: Page, suffix: string): Promise<{ email: string; nickname: string }> {
  const email = `${suffix}-${RUN_ID}@test.local`;
  const nickname = `${suffix}-${RUN_ID}`;
  await page.goto("/signup");
  await page.getByPlaceholder("ニックネーム").fill(nickname);
  await page.getByPlaceholder("email").fill(email);
  await page.getByPlaceholder(/password/).fill("password123");
  await page.getByRole("button", { name: "登録" }).click();
  await page.waitForURL(/\/mypage/);
  return { email, nickname };
}

test("two users complete a battle end-to-end", async ({ browser }) => {
  const aliceCtx = await browser.newContext();
  const bobCtx = await browser.newContext();
  const alice = await aliceCtx.newPage();
  const bob = await bobCtx.newPage();

  await signup(alice, "alice");
  await signup(bob, "bob");

  await alice.goto("/battles/new");
  await alice.getByLabel("タイトル").fill(`smoke-${RUN_ID}`);
  await alice.getByRole("button", { name: "作成する" }).click();
  await alice.waitForURL(/\/battles\/[^/]+$/);
  const aliceBattleUrl = alice.url();
  const battleId = aliceBattleUrl.split("/battles/")[1];
  expect(battleId).toBeTruthy();

  await bob.goto("/battles");
  await expect(bob.getByText(`smoke-${RUN_ID}`)).toBeVisible({ timeout: 10_000 });
  await bob.goto(`/battles/${battleId}`);
  await bob.getByRole("button", { name: "入室する" }).click();

  await expect(alice.getByText(`bob-${RUN_ID}`)).toBeVisible({ timeout: 15_000 });
  await expect(bob.getByText(`alice-${RUN_ID}`)).toBeVisible();

  const fakeImage = Buffer.from("This is a fake submission for E2E testing");
  for (const [page, label] of [
    [alice, "alice"],
    [bob, "bob"],
  ] as const) {
    await page.goto(`/battles/${battleId}/submit`);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: `${label}.jpg`,
      mimeType: "image/jpeg",
      buffer: fakeImage,
    });
    await page.getByRole("button", { name: /提出/ }).click();
    await expect(page.getByText("✅ 提出しました")).toBeVisible({ timeout: 30_000 });
  }

  await alice.goto(`/battles/${battleId}/result`);
  await bob.goto(`/battles/${battleId}/result`);
  await expect(alice.getByRole("heading", { name: "対戦結果" })).toBeVisible();
  await alice.waitForTimeout(4000);

  await expect(alice.locator("text=/WIN|LOSE|DRAW/")).toBeVisible();
  await expect(bob.locator("text=/WIN|LOSE|DRAW/")).toBeVisible();

  await alice.goto("/mypage");
  await expect(alice.getByText(`alice-${RUN_ID}`)).toBeVisible();

  await aliceCtx.close();
  await bobCtx.close();
});
