import { cn } from "@/lib/utils";

export function StatusChip({
  tone = "muted",
  pulse = false,
  children,
  className,
}: {
  tone?: "muted" | "amber" | "add" | "del";
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    muted: "border-border text-muted-foreground",
    amber: "border-amber/40 text-amber",
    add: "border-add/40 text-add",
    del: "border-del/40 text-del",
  };

  return (
    <span
      className={cn(
        "font-plex inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] tracking-[0.14em] uppercase",
        tones[tone],
        pulse && "status-pulse",
        className
      )}
    >
      {children}
    </span>
  );
}
