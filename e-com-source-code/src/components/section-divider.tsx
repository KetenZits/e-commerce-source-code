import { cn } from "@/lib/utils";

export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="separator" aria-hidden>
      <span className="h-px flex-1 bg-brass/70" />
      <span className="size-1.5 rotate-45 bg-brass" />
      <span className="h-px flex-1 bg-brass/70" />
    </div>
  );
}
