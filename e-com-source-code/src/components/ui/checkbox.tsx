import * as React from "react";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-3.5 shrink-0 appearance-none rounded-sm border border-border bg-void checked:border-amber checked:bg-amber checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%230B0E14%22 stroke-width=%222%22><path d=%22M3 8.5 6.5 12 13 4%22/></svg>')] checked:bg-center checked:bg-no-repeat focus-visible:ring-2 focus-visible:ring-amber/50",
        className
      )}
      {...props}
    />
  );
}

export { Checkbox };
