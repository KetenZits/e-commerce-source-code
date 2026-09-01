"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { LordIconPlayerProps } from "@/components/icons/lordicon-player";

const LordIconPlayer = dynamic(() => import("@/components/icons/lordicon-player"), {
  ssr: false,
});

export type LordIconProps = LordIconPlayerProps;

/** Client-only Lordicon player. Safe for Next.js (lottie-web needs `document`). */
export function LordIcon({ className, size = 32, ...props }: LordIconProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <LordIconPlayer size={size} {...props} />
    </span>
  );
}
