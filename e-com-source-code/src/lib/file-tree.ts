export type CoverSnippet = {
  code: string;
  lang: string;
};

export type FileNode = {
  name: string;
  type: "file" | "dir";
  language?: string;
  content?: string;
  children?: FileNode[];
};

export type PreviewFile = {
  path: string;
  language: string;
  content: string;
};

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function asCoverSnippet(value: unknown): CoverSnippet {
  if (value && typeof value === "object" && "code" in value && "lang" in value) {
    const snippet = value as CoverSnippet;
    return { code: String(snippet.code), lang: String(snippet.lang) };
  }
  return { code: "", lang: "txt" };
}

export function asFileNode(value: unknown): FileNode {
  if (value && typeof value === "object" && "name" in value && "type" in value) {
    return value as FileNode;
  }
  return { name: "root", type: "dir", children: [] };
}

export function flattenFiles(node: FileNode, prefix = ""): PreviewFile[] {
  const path = prefix ? `${prefix}/${node.name}` : node.name;
  if (node.type === "file") {
    if (!node.content) return [];
    return [{ path: prefix ? path : node.name, language: node.language ?? "txt", content: node.content }];
  }
  return (node.children ?? []).flatMap((child) => flattenFiles(child, node.name === "root" ? "" : path));
}

export function filesToTree(files: PreviewFile[]): FileNode {
  const root: FileNode = { name: "root", type: "dir", children: [] };

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let current = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      current.children ??= [];
      let next = current.children.find((child) => child.name === part);
      if (!next) {
        next = isFile
          ? { name: part, type: "file", language: file.language, content: file.content }
          : { name: part, type: "dir", children: [] };
        current.children.push(next);
      }
      current = next;
    });
  }

  return root;
}

export function firstPreviewFile(node: FileNode): PreviewFile | null {
  const files = flattenFiles(node);
  return files[0] ?? null;
}
