"use client";

import { useMemo, useState } from "react";
import { asFileNode, firstPreviewFile, flattenFiles } from "@/lib/file-tree";
import { FileTree } from "@/components/product/file-tree";
import { CodePreview } from "@/components/product/code-preview";

export function ProductPreview({ tree }: { tree: unknown }) {
  const root = useMemo(() => asFileNode(tree), [tree]);
  const initial = firstPreviewFile(root);
  const [selected, setSelected] = useState(initial);

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <div className="rounded-lg border border-hair bg-surface p-3">
        <p className="util-label mb-2">Explorer</p>
        <FileTree
          node={root}
          selected={selected?.path}
          onSelect={(path, file) =>
            setSelected({
              path,
              language: file.language ?? "txt",
              content: file.content ?? "",
            })
          }
        />
        <p className="mt-4 text-xs text-muted-foreground">
          {flattenFiles(root).length} preview files. The paid archive is the full source.
        </p>
      </div>
      {selected ? (
        <CodePreview path={selected.path} language={selected.language} value={selected.content} />
      ) : (
        <div className="rounded-lg border border-dashed border-hair p-6 font-mono text-sm text-muted-foreground">
          Select a file to preview.
        </div>
      )}
    </div>
  );
}
