export const MAX_FILE_SIZE = 100 * 1024 * 1024;
export const FILE_EXTENSIONS = [
  "zip",
  "pdf",
  "doc",
  "docx",
  "md",
  "mdx",
  "txt",
  "csv",
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "json",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "c",
  "h",
  "cpp",
  "hpp",
  "cs",
  "php",
  "swift",
  "kt",
  "kts",
  "sql",
  "sh",
  "bash",
  "css",
  "scss",
  "html",
  "xml",
  "yaml",
  "yml",
  "toml",
  "ini",
  "r",
  "vue",
  "svelte",
];
export const FILE_ACCEPT = FILE_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");
export function fileError(name: string, size: number) {
  if (!Number.isSafeInteger(size) || size <= 0)
    return "Choose a non-empty file.";
  if (size > MAX_FILE_SIZE)
    return "Files must be 100 MB or smaller (104,857,600 bytes).";
  if (!FILE_EXTENSIONS.includes(name.split(".").pop()?.toLowerCase() ?? ""))
    return "Choose a ZIP, PDF, Word document, Markdown/text, CSV, or supported source-code file.";
  return null;
}
export function storageName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const stem =
    name
      .slice(0, -(extension.length + 1))
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/^[^a-zA-Z0-9]+/, "")
      .slice(0, 180) || "file";
  return `${stem}.${extension}`;
}
export function fileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
