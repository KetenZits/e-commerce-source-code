import { expect, test } from "vitest";
import { estimatedDeliveryLabel, matchShippingZone } from "./shipping";

const zones = [
  {
    id: "metro-light",
    name: "Bangkok metro, light",
    provinces: ["Bangkok", "Nonthaburi"],
    minWeightGrams: 0,
    maxWeightGrams: 2000,
    feeCents: 5000,
    sortOrder: 10,
  },
  {
    id: "nationwide",
    name: "Nationwide",
    provinces: ["*"],
    minWeightGrams: 0,
    maxWeightGrams: null,
    feeCents: 12000,
    sortOrder: 40,
  },
];

test("matches metro zone by province and weight before nationwide fallback", () => {
  const zone = matchShippingZone(zones, "Bangkok", 400);
  expect(zone?.id).toBe("metro-light");
  expect(zone?.feeCents).toBe(5000);
});

test("falls back to nationwide for other provinces", () => {
  expect(matchShippingZone(zones, "Chiang Mai", 400)?.id).toBe("nationwide");
});

test("labels metro deliveries faster than upcountry", () => {
  expect(estimatedDeliveryLabel("Bangkok")).toBe("2–4 days");
  expect(estimatedDeliveryLabel("Chiang Mai")).toBe("4–7 days");
});
