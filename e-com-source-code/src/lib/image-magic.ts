const SIGNATURES: { type: string; test: (bytes: Buffer) => boolean }[] = [
  { type: "image/jpeg", test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/png",
    test: (b) =>
      b.length > 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    type: "image/gif",
    test: (b) => {
      if (b.length < 6) return false;
      const header = b.subarray(0, 6).toString("ascii");
      return header === "GIF87a" || header === "GIF89a";
    },
  },
  {
    type: "image/webp",
    test: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

export function detectImageMime(body: Buffer) {
  return SIGNATURES.find((entry) => {
    try {
      return entry.test(body);
    } catch {
      return false;
    }
  })?.type ?? null;
}

export function assertImageBuffer(body: Buffer, claimedType?: string) {
  const detected = detectImageMime(body);
  if (!detected) {
    throw new Error("Only JPEG, PNG, GIF, or WebP images are allowed.");
  }
  if (claimedType && claimedType !== "application/octet-stream" && !claimedType.startsWith("image/")) {
    throw new Error("File is not an image.");
  }
  return detected;
}
