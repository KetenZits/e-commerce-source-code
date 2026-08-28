"use client";

import type { PointerEvent, ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function TiltCard({
  children,
  className,
  innerClassName,
  intensity = 7,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  intensity?: number;
}) {
  const reduceMotion = useReducedMotion();
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, SPRING.tilt);
  const rotateY = useSpring(rawRotateY, SPRING.tilt);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    rawRotateX.set(y * -intensity);
    rawRotateY.set(x * intensity);
  }

  function resetTilt() {
    rawRotateX.set(0);
    rawRotateY.set(0);
  }

  return (
    <div
      className={cn("group/tilt [perspective:1100px]", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <motion.div
        className={cn("h-full [transform-style:preserve-3d]", innerClassName)}
        style={reduceMotion ? undefined : { rotateX, rotateY }}
        whileHover={reduceMotion ? undefined : { y: -5, scale: 1.006 }}
        transition={SPRING.press}
      >
        {children}
      </motion.div>
    </div>
  );
}
