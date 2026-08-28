"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  MOTION_DURATION,
  PREMIUM_EASE,
  VIEWPORT_ONCE,
} from "@/lib/motion";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{
        duration: MOTION_DURATION.slow,
        delay: delay / 1000,
        ease: PREMIUM_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}
