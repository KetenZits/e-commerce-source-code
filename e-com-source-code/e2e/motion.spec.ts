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

  await marquee.hover();
  await expect
    .poll(() =>
      track.evaluate((element) => getComputedStyle(element).animationPlayState),
    )
    .toBe("paused");
});

test("reduced motion renders a static product strip", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const marquee = page.locator('[data-motion="reduced"]').first();
  await expect(marquee).toBeVisible();
  await expect
    .poll(() =>
      marquee
        .locator(".product-marquee-track")
        .evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe("none");
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

test("product gallery keeps manual image selection", async ({ page }) => {
  await page.goto("/products/linen-overshirt");
  await page.getByRole("button", { name: "Show image 2" }).click();
  await expect(
    page.getByRole("img", { name: "Linen overshirt, view 2" }),
  ).toBeVisible();
});
