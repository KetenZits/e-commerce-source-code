"use client";

import Editor from "@monaco-editor/react";

export function CodePreview({
  path,
  language,
  value,
}: {
  path: string;
  language: string;
  value: string;
}) {
  const lang =
    language === "tsx" || language === "ts"
      ? "typescript"
      : language === "vue"
        ? "html"
        : language === "php"
          ? "php"
          : language;

  return (
    <div className="overflow-hidden rounded-lg border border-hair bg-void">
      <div className="font-plex border-b border-hair px-3 py-2 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {path} · read-only
      </div>
      <Editor
        height="420px"
        language={lang}
        value={value}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          renderLineHighlight: "none",
          padding: { top: 12 },
        }}
      />
    </div>
  );
}
