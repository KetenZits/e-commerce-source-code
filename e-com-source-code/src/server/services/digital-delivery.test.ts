import { describe, expect, it } from "vitest";
import {
  decryptDigitalDelivery,
  encryptDigitalDelivery,
} from "@/server/services/digital-delivery";

describe("digital delivery encryption", () => {
  it("round-trips access details without storing plaintext", () => {
    const content = "Game ID: player-123\nPassword: secret-code";
    const encrypted = encryptDigitalDelivery(content);

    expect(encrypted).not.toContain("player-123");
    expect(decryptDigitalDelivery(encrypted)).toBe(content);
  });

  it("does not expose malformed or tampered payloads", () => {
    expect(decryptDigitalDelivery("v1.invalid.payload.value")).toBeNull();
    expect(decryptDigitalDelivery(null)).toBeNull();
  });
});
