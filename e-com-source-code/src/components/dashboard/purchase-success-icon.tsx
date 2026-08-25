"use client";

import { Player } from "@lordicon/react";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

export function PurchaseSuccessIcon() {
  const [icon, setIcon] = useState<object | null>(null);

  useEffect(() => {
    fetch("https://cdn.lordicon.com/lupuorrc.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setIcon(data))
      .catch(() => setIcon(null));
  }, []);

  if (!icon) {
    return (
      <div className="flex size-16 items-center justify-center rounded-full border border-add/40 text-add">
        <Check className="size-7" />
      </div>
    );
  }

  return <Player icon={icon} size={72} />;
}
