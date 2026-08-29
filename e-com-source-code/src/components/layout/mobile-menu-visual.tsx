"use client";

import OrbitImages from "@/components/reactbits/OrbitImages";
import RotatingText from "@/components/reactbits/RotatingText";
import type { StoreMode } from "@/lib/storefront-config";

export function MobileMenuVisual({
  images,
  storeMode,
}: {
  images: string[];
  storeMode: StoreMode;
}) {
  const messages =
    storeMode === "digital"
      ? ["Instant access", "Secure delivery", "Digital collection"]
      : ["Considered goods", "Made for daily use", "Curated collection"];

  return (
    <div className="relative -mx-2 overflow-hidden rounded-xl border border-border/70 bg-muted/35">
      <span className="sr-only">{messages.join(". ")}</span>
      {images.length > 0 ? (
        <OrbitImages
          images={images.slice(0, 6)}
          altPrefix="Featured product"
          shape="ellipse"
          baseWidth={800}
          radiusX={310}
          radiusY={310}
          rotation={-7}
          duration={34}
          itemSize={128}
          direction="normal"
          width="100%"
          height={176}
          responsive
          centerContent={
            <div className="max-w-44 rounded-full border border-border/70 bg-background/90 px-4 py-2 text-center shadow-sm backdrop-blur-md">
              <RotatingText
                texts={messages}
                splitBy="words"
                staggerDuration={0.035}
                staggerFrom="center"
                rotationInterval={2600}
                mainClassName="justify-center text-xs font-medium uppercase tracking-[0.16em] text-foreground"
                splitLevelClassName="overflow-hidden"
              />
            </div>
          }
        />
      ) : (
        <div className="flex h-24 items-center justify-center px-4">
          <RotatingText
            texts={messages}
            splitBy="words"
            staggerDuration={0.035}
            staggerFrom="center"
            rotationInterval={2600}
            mainClassName="justify-center text-xs font-medium uppercase tracking-[0.16em] text-foreground"
            splitLevelClassName="overflow-hidden"
          />
        </div>
      )}
    </div>
  );
}
