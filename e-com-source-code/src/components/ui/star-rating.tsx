"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const icon = size === "sm" ? "size-3.5" : "size-4";
  const rounded = Math.round(Math.min(5, Math.max(0, value)) * 2) / 2;
  const interactive = Boolean(onChange);

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${rounded} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const star = index + 1;
        const filled = rounded >= star;
        const half = !filled && rounded >= star - 0.5;
        const iconClass = cn(icon, "text-border");

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
              className="rounded-sm text-muted-foreground transition-colors hover:text-brass"
              onClick={() => onChange?.(star)}
            >
              <Star className={cn(icon, star <= value ? "fill-brass text-brass" : "text-border")} />
            </button>
          );
        }

        return (
          <span key={star} className="relative inline-flex">
            <Star className={iconClass} />
            {filled || half ? (
              <Star
                className={cn("absolute inset-0 fill-brass text-brass", icon)}
                style={half ? { clipPath: "inset(0 50% 0 0)" } : undefined}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
