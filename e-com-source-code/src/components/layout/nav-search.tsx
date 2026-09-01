"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LordIcon } from "@/components/icons/lord-icon";
import searchIcon from "@/icons/lordicon/search.json";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/locale-provider";

export function NavSearch({ onSubmit }: { onSubmit?: () => void }) {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [iconPlay, setIconPlay] = useState(0);

  return (
    <form
      className="relative"
      onMouseEnter={() => setIconPlay((n) => n + 1)}
      onSubmit={(event) => {
        event.preventDefault();
        const next = query.trim();
        router.push(next ? `/catalog?q=${encodeURIComponent(next)}` : "/catalog");
        onSubmit?.();
      }}
    >
      <LordIcon
        icon={searchIcon}
        size={14}
        trigger="manual"
        colorize="currentColor"
        playKey={iconPlay}
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("nav.search")}
        aria-label={t("search.placeholder")}
        className="h-8 w-40 pl-8 lg:w-52"
      />
    </form>
  );
}
