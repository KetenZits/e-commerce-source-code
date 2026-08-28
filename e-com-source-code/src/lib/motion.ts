export const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;

export const MOTION_DURATION = {
  fast: 0.22,
  medium: 0.48,
  slow: 0.78,
} as const;

export const SPRING = {
  press: { type: "spring" as const, stiffness: 420, damping: 28 },
  tilt: { stiffness: 180, damping: 24, mass: 0.65 },
} as const;

export const VIEWPORT_ONCE = {
  once: true,
  amount: 0.16,
  margin: "0px 0px -8% 0px",
} as const;
