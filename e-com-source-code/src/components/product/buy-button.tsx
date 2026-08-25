"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BuyButton({ productId, className }: { productId: string; className?: string }) {
  const router = useRouter();

  return (
    <Button className={className} onClick={() => router.push(`/buy/${productId}`)}>
      Buy now
    </Button>
  );
}
