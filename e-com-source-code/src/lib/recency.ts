export type Recency = "new" | "updated" | "stable";

const DAY = 1000 * 60 * 60 * 24;

export function recencyOf(createdAt: Date, updatedAt: Date, now = new Date()): Recency {
  if (now.getTime() - createdAt.getTime() < 14 * DAY) return "new";
  if (now.getTime() - updatedAt.getTime() < 14 * DAY) return "updated";
  return "stable";
}

export const recencyLabel: Record<Recency, string> = {
  new: "new",
  updated: "updated",
  stable: "stable",
};

export const recencyBorder: Record<Recency, string> = {
  new: "border-t-add",
  updated: "border-t-amber",
  stable: "border-t-border",
};
