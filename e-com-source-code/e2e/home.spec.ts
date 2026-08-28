import { expect, test } from "@playwright/test";

test("home renders the atelier catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Shop the catalog" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Featured" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "New in" })).toBeVisible();
});

test("catalog lists seeded products", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.getByRole("link", { name: "Linen overshirt", exact: true })).toBeVisible();
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

test("guest wishlist persists on this device", async ({ page }) => {
  await page.goto("/catalog");
  const heart = page.getByRole("button", { name: "Add to wishlist" }).first();
  await heart.click();
  await expect(page.getByRole("button", { name: "Remove from wishlist" }).first()).toBeVisible();
  await page.goto("/wishlist");
  await expect(page.getByRole("heading", { name: "Wishlist" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove from wishlist" }).first()).toBeVisible();
});

test("admin sees analytics, baht pricing, and order details", async ({ page }) => {
  await page.goto("/auth/signin");
  await page.getByLabel("Email").fill("admin@atelier.dev");
  await page.getByLabel("Password").fill("admin1234");
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "New in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Admin" })).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Orders today")).toBeVisible();
  await expect(page.getByText("Average order")).toBeVisible();

  await page.goto("/admin/products/new");
  await page.getByRole("button", { name: /Price & stock/ }).click();
  await page.locator('input[name="basePriceBaht"]').fill("490");
  await expect(page.locator("aside").getByText(/490/)).toBeVisible();

  await page.goto("/admin/orders");
  const firstOrder = page.locator("tbody tr").first();
  await expect(firstOrder).toBeVisible();
  await firstOrder.click();
  await expect(page.getByRole("heading", { name: "Status history" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shipping address" })).toBeVisible();
});

test("admin can switch to digital checkout and deliver access details", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const adminContext = await browser.newContext();
  const buyerContext = await browser.newContext();
  const admin = await adminContext.newPage();
  const buyer = await buyerContext.newPage();
  let switched = false;

  try {
    await admin.goto("/auth/signin");
    await admin.getByLabel("Email").fill("admin@atelier.dev");
    await admin.getByLabel("Password").fill("admin1234");
    await admin.getByRole("main").getByRole("button", { name: "Sign in" }).click();
    await expect(admin.getByRole("button", { name: "Admin" })).toBeVisible();
    await admin.goto("/admin/storefront");
    await admin.getByRole("radio", { name: /digital/i }).check();
    await admin.getByRole("button", { name: "Save storefront" }).click();
    await expect(admin.getByText("Storefront settings saved")).toBeVisible();
    switched = true;

    await buyer.goto("/auth/signin");
    await buyer.getByLabel("Email").fill("buyer@atelier.dev");
    await buyer.getByLabel("Password").fill("buyer1234");
    await buyer.getByRole("main").getByRole("button", { name: "Sign in" }).click();
    await expect(
      buyer.getByRole("button", { name: "Buyer" }),
    ).toBeVisible();
    await buyer.goto("/products/stoneware-mug");
    await buyer.getByRole("button", { name: "Add to cart" }).click();
    await expect(buyer.getByText("Added to cart")).toBeVisible();
    await buyer.goto("/checkout");
    await expect(
      buyer.getByRole("heading", { name: "No shipping address required" }),
    ).toBeVisible();
    await buyer.getByRole("button", { name: "Continue to PromptPay" }).click();
    await expect(buyer.getByText("Digital delivery").first()).toBeVisible();
    await buyer.getByRole("button", { name: "I've transferred" }).click();
    await expect(
      buyer.getByRole("heading", { name: "Order confirmed" }),
    ).toBeVisible({ timeout: 15_000 });
    const orderUrl = buyer.url();

    await admin.goto("/admin/orders");
    await admin.locator("tbody tr").first().click();
    await admin
      .locator('textarea[name="digitalDelivery"]')
      .fill("Game ID: atelier-player\nPassword: secure-demo");
    await admin.getByRole("button", { name: "Deliver to customer" }).click();
    await expect(admin.getByText("Digital access delivered")).toBeVisible();

    await buyer.goto(orderUrl);
    await expect(
      buyer.getByRole("heading", { name: "Your digital order is ready" }),
    ).toBeVisible();
    await expect(buyer.getByText("atelier-player")).toBeVisible();
  } finally {
    if (switched) {
      await admin.goto("/admin/storefront");
      await admin.getByRole("radio", { name: /physical/i }).check();
      await admin.getByRole("button", { name: "Save storefront" }).click();
      await expect(admin.getByText("Storefront settings saved")).toBeVisible();
    }
    await adminContext.close();
    await buyerContext.close();
  }
});
