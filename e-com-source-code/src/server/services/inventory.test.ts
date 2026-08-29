import { describe, expect, it } from "vitest";
import { availableQty } from "@/server/services/inventory";
import { detectImageMime } from "@/lib/image-magic";

describe("availableQty", () => {
  it("subtracts reserved units from on-hand stock", () => {
    expect(availableQty(10, 3)).toBe(7);
    expect(availableQty(2, 5)).toBe(0);
  });
});

describe("image magic bytes", () => {
  it("accepts jpeg signatures", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectImageMime(jpeg)).toBe("image/jpeg");
  });

  it("rejects arbitrary bytes", () => {
    expect(detectImageMime(Buffer.from("not-an-image"))).toBeNull();
  });
});
