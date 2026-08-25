import { expect, test } from "@playwright/test";

test("home renders the atelier catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Shop the catalog" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "New in" })).toBeVisible();
});

test("catalog lists seeded products", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.getByRole("link", { name: "Linen overshirt" })).toBeVisible();
});

test("product page can add an in-stock variant to the cart", async ({ page }) => {
  await page.goto("/products/linen-overshirt");
  await expect(page.getByRole("heading", { name: "Linen overshirt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
});

test("buyer can check out a physical order in demo mode", async ({ page }) => {
  await page.goto("/auth/signin");
  await page.getByLabel("Email").fill("buyer@atelier.dev");
  await page.getByLabel("Password").fill("buyer1234");
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "New in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buyer" })).toBeVisible();
  await page.goto("/products/stoneware-mug");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Added to cart")).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await page.getByText("Buyer Atelier").click();
  await expect(page.getByText(/Estimated delivery/)).toBeVisible();
  await page.getByRole("button", { name: "Continue to PromptPay" }).click();
  await expect(page.getByRole("heading", { name: "PromptPay" })).toBeVisible();
  await expect(page.getByText("waiting for payment")).toBeVisible();
  await page.getByRole("button", { name: "I've transferred" }).click();
  await expect(page.getByRole("heading", { name: "Order confirmed" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Stoneware mug")).toBeVisible();
});
