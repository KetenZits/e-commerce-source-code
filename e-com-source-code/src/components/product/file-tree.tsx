"use client";

import { ChevronRight, FileCode2, Folder } from "lucide-react";
import { useState } from "react";
import type { FileNode } from "@/lib/file-tree";
import { cn } from "@/lib/utils";

export function FileTree({
  node,
  selected,
  onSelect,
}: {
  node: FileNode;
  selected?: string;
  onSelect: (path: string, file: FileNode) => void;
}) {
  return (
    <div className="font-plex text-[12px] text-muted-foreground">
      <TreeLevel nodes={node.children ?? []} prefix="" selected={selected} onSelect={onSelect} />
    </div>
  );
}

function TreeLevel({
  nodes,
  prefix,
  selected,
  onSelect,
}: {
  nodes: FileNode[];
  prefix: string;
  selected?: string;
  onSelect: (path: string, file: FileNode) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((child) => (
        <TreeItem key={child.name} node={child} prefix={prefix} selected={selected} onSelect={onSelect} />
      ))}
    </ul>
  );
}

function TreeItem({
  node,
  prefix,
  selected,
  onSelect,
}: {
  node: FileNode;
  prefix: string;
  selected?: string;
  onSelect: (path: string, file: FileNode) => void;
}) {
  const path = prefix ? `${prefix}/${node.name}` : node.name;
  const [open, setOpen] = useState(true);

  if (node.type === "dir") {
    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-1 rounded-sm px-1.5 py-1 text-left hover:bg-elevated hover:text-foreground"
        >
          <ChevronRight className={cn("size-3 transition", open && "rotate-90")} />
          <Folder className="size-3.5" />
          {node.name}
        </button>
        {open ? (
          <div className="ml-3 border-l border-hair pl-2">
            <TreeLevel nodes={node.children ?? []} prefix={path} selected={selected} onSelect={onSelect} />
          </div>
        ) : null}
      </li>
    );
  }

  const previewable = Boolean(node.content);
  return (
    <li>
      <button
        type="button"
        disabled={!previewable}
        onClick={() => previewable && onSelect(path, node)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left",
          previewable ? "hover:bg-elevated hover:text-foreground" : "cursor-default opacity-50",
          selected === path && "bg-elevated text-amber"
        )}
      >
        <FileCode2 className="size-3.5" />
        {node.name}
      </button>
    </li>
  );
}
