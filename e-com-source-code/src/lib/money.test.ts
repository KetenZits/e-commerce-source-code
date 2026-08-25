import { expect, test } from "vitest";
import { formatMoney, satangToBaht } from "./money";
import { recencyOf } from "./recency";
import { filesToTree, flattenFiles } from "./file-tree";

test("formats THB from satang", () => {
  expect(satangToBaht(149000)).toBe(1490);
  expect(formatMoney(149000, "THB")).toContain("1,490");
});

test("marks listings new, updated, or stable", () => {
  const now = new Date("2026-08-25");
  expect(recencyOf(new Date("2026-08-20"), new Date("2026-08-20"), now)).toBe("new");
  expect(recencyOf(new Date("2026-01-01"), new Date("2026-08-20"), now)).toBe("updated");
  expect(recencyOf(new Date("2025-01-01"), new Date("2025-01-01"), now)).toBe("stable");
});

test("builds a preview tree from paths", () => {
  const tree = filesToTree([
    { path: "src/lib/auth.ts", language: "ts", content: "export {}" },
    { path: "src/app/page.tsx", language: "tsx", content: "export default function Page() { return null }" },
  ]);
  expect(flattenFiles(tree).map((file) => file.path)).toEqual(["src/lib/auth.ts", "src/app/page.tsx"]);
});
