import { cn } from "@/lib/utils";

export function StatusChip({
  tone = "muted",
  pulse = false,
  children,
  className,
}: {
  tone?: "muted" | "brass" | "forest" | "brick";
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    muted: "border-border text-muted-foreground",
    brass: "border-brass/50 text-brass",
    forest: "border-primary/30 text-primary",
    brick: "border-destructive/40 text-destructive",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] tracking-[0.14em] uppercase",
        tones[tone],
        pulse && "status-pulse",
        className
      )}
    >
      {children}
    </span>
  );
}
