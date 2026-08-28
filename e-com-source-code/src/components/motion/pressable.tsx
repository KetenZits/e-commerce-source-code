"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Pressable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("inline-flex", className)}
      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.012 }}
      whileTap={reduceMotion ? undefined : { y: 0, scale: 0.97 }}
      transition={SPRING.press}
    >
      {children}
    </motion.div>
  );
}
