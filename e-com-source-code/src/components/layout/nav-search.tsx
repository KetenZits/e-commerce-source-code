"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function NavSearch({ onSubmit }: { onSubmit?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        const next = query.trim();
        router.push(next ? `/catalog?q=${encodeURIComponent(next)}` : "/catalog");
        onSubmit?.();
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search"
        aria-label="Search catalog"
        className="h-8 w-40 pl-8 lg:w-52"
      />
    </form>
  );
}
