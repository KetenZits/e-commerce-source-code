"use client";

import { useEffect, useState } from "react";

const LINES = [
  { prefix: "$", text: " git clone premium-boilerplates" },
  { prefix: ">", text: " production-ready codebases. Read the code" },
  { prefix: ">", text: " before you buy it." },
];

export function TerminalHero({ count }: { count: number }) {
  const lines = [
    LINES[0],
    { prefix: ">", text: ` ${count} production-ready codebases. Read the code` },
    LINES[2],
  ];
  const full = lines.map((line) => line.prefix + line.text).join("\n");
  const [text, setText] = useState("");
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      setReduce(true);
      setText(full);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setText(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [full]);

  const shown = reduce ? full : text;

  return (
    <div className="overflow-hidden rounded-lg border border-hair bg-surface">
      <div className="flex items-center gap-2 border-b border-hair px-3 py-2">
        <span className="flex gap-1" aria-hidden>
          <span className="size-2 rounded-full bg-[#ff5f56]" />
          <span className="size-2 rounded-full bg-[#ffbd2e]" />
          <span className="size-2 rounded-full bg-[#27c93f]" />
        </span>
        <span className="font-plex text-[10px] tracking-[0.16em] text-muted-foreground uppercase">zsh — sourcecode</span>
      </div>
      <pre className="min-h-[132px] bg-void px-4 py-4 font-mono text-sm leading-7 text-foreground sm:text-base">
        {shown}
        {!reduce && shown.length < full.length ? <span className="terminal-cursor" /> : null}
      </pre>
    </div>
  );
}
