import { expect, test } from "@playwright/test";

test("product marquee moves continuously and pauses on interaction", async ({
  page,
}) => {
  await page.goto("/");
  const marquee = page.locator('[data-motion="marquee"]').first();
  const track = marquee.locator(".product-marquee-track");

  await expect(marquee).toBeVisible();
  await expect
    .poll(() => track.evaluate((element) => getComputedStyle(element).animationName))
    .toBe("product-marquee");

  await marquee.locator(".product-marquee-viewport").hover();
  await expect
    .poll(() =>
      track.evaluate((element) => getComputedStyle(element).animationPlayState),
    )
    .toBe("paused");
});

test("reduced motion still shows the product carousel", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator(".product-marquee").first()).toBeVisible();
  await expect(page.locator(".product-marquee-track").first()).toBeVisible();
});

test("premium storefront remains contained on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".product-marquee").first()).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});

test("staggered navigation is responsive and keyboard dismissible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Open menu" });
  await expect(menuButton).toBeVisible();
  await expect(menuButton).toHaveText("");
  await menuButton.click();

  await expect(page.getByRole("button", { name: "Close menu" })).toHaveText("");
  await expect(page.getByRole("link", { name: "Go to Shop" })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Search catalog" }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      Math.round((await page.getByRole("complementary").boundingBox())?.x ?? -1),
    )
    .toBe(0);

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open menu" }),
  ).toBeFocused();
});

test("hero orbit stays contained at iPad dimensions", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/");

  const orbit = page.getByTestId("hero-orbit");
  const center = page.getByTestId("hero-orbit-center");
  await expect(orbit).toBeVisible();
  await expect(center).toBeVisible();
  await expect(center.locator("img")).toBeVisible();
  expect(await orbit.locator("img").count()).toBeGreaterThanOrEqual(6);

  const dimensions = await orbit.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      viewport: document.documentElement.clientWidth,
      left: Math.round(box.left),
      right: Math.round(box.right),
      width: Math.round(box.width),
    };
  });

  expect(dimensions.width).toBeGreaterThan(700);
  expect(dimensions.left).toBeGreaterThanOrEqual(0);
  expect(dimensions.right).toBeLessThanOrEqual(dimensions.viewport);
});

test("product gallery keeps manual image selection", async ({ page }) => {
  await page.goto("/products/linen-overshirt");
  await page.getByRole("button", { name: "Show image 2" }).click();
  await expect(
    page.getByRole("img", { name: "Linen overshirt, view 2" }),
  ).toBeVisible();
});
