const KEYWORDS: Record<string, string[]> = {
  ts: ["import", "export", "from", "const", "let", "function", "return", "async", "await", "type", "interface", "extends", "new", "class", "if", "else"],
  tsx: ["import", "export", "from", "const", "let", "function", "return", "async", "await", "type", "interface", "export", "default"],
  js: ["import", "export", "from", "const", "let", "function", "return", "async", "await"],
  php: ["<?php", "namespace", "use", "class", "function", "return", "public", "protected", "private", "static"],
  vue: ["import", "export", "const", "function", "return", "setup"],
  json: [],
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function highlightSnippet(code: string, lang: string) {
  const escaped = escapeHtml(code);
  const keywords = KEYWORDS[lang] ?? KEYWORDS.ts;

  const lines = escaped.split("\n").map((line) => {
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("#") || line.trimStart().startsWith("--")) {
      return `<span class="tok-cmt">${line}</span>`;
    }
    let out = line.replace(/(&quot;|")([^"]*)(&quot;|")/g, `<span class="tok-str">"$2"</span>`);
    out = out.replace(/'([^']*)'/g, `<span class="tok-str">'$1'</span>`);
    out = out.replace(/`([^`]*)`/g, `<span class="tok-str">\`$1\`</span>`);
    out = out.replace(/\b(\d+)\b/g, `<span class="tok-num">$1</span>`);
    for (const kw of keywords) {
      out = out.replace(new RegExp(`\\b(${kw})\\b`, "g"), `<span class="tok-kw">$1</span>`);
    }
    out = out.replace(/\b([A-Z][A-Za-z0-9]+)\b/g, `<span class="tok-type">$1</span>`);
    return out;
  });

  return lines.join("\n");
}
