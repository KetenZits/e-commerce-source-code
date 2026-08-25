import { expect, test } from "vitest";
import { formatMoney, satangToBaht } from "./money";
import { formatAttributes } from "./product";

test("formats THB from satang", () => {
  expect(satangToBaht(149000)).toBe(1490);
  expect(formatMoney(149000, "THB")).toContain("1,490");
});

test("formats variant attributes for display", () => {
  expect(formatAttributes({ size: "M", color: "Black" })).toBe("size M · color Black");
  expect(formatAttributes(null)).toBe("");
});
