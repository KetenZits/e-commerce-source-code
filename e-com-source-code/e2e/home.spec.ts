import { expect, test } from "@playwright/test";

test("home renders the terminal hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Browse catalog" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Featured" })).toBeVisible();
});

test("catalog lists seeded products", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.getByRole("link", { name: /next-saas-kit/i }).first()).toBeVisible();
});

test("product page shows buy now", async ({ page }) => {
  await page.goto("/products/next-saas-kit");
  await expect(page.getByRole("heading", { name: "next-saas-kit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buy now" })).toBeVisible();
});

test("buyer can check out a listing in demo mode", async ({ page }) => {
  await page.goto("/auth/signin");
  await page.getByLabel("Email").fill("buyer@sourcecode.dev");
  await page.getByLabel("Password").fill("buyer1234");
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Featured" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buyer" })).toBeVisible();
  await page.goto("/products/astro-docs-ui");
  await page.getByRole("button", { name: "Buy now" }).click();
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(page.getByText("waiting for payment")).toBeVisible();
  await page.getByRole("button", { name: "I've transferred" }).click();
  await expect(page.getByRole("heading", { name: "My purchases" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("astro-docs-ui")).toBeVisible();
});
