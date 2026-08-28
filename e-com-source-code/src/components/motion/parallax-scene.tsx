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

export function ParallaxScene({
  children,
  className,
  intensity = 4,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawY, SPRING.tilt);
  const rotateY = useSpring(rawX, SPRING.tilt);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    rawX.set(
      ((event.clientX - bounds.left) / bounds.width - 0.5) * intensity,
    );
    rawY.set(
      ((event.clientY - bounds.top) / bounds.height - 0.5) * -intensity,
    );
  }

  function reset() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <div
      className={cn("[perspective:1400px]", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
    >
      <motion.div
        className="relative h-full [transform-style:preserve-3d]"
        style={reduceMotion ? undefined : { rotateX, rotateY }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ParallaxPlane({
  children,
  className,
  depth = 0,
}: {
  children: ReactNode;
  className?: string;
  depth?: number;
}) {
  return (
    <div
      className={className}
      style={{ transform: `translateZ(${depth}px)` }}
    >
      {children}
    </div>
  );
}
