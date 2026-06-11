import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

export interface MarkdownFile {
  source: string;
  raw: string;
}

// Title parsing now belongs to markdownChunker (via meta.title); this module
// only locates and reads the raw markdown files.
export async function loadArticles(
  articlesDir: string,
): Promise<MarkdownFile[]> {
  let entries: string[];
  try {
    const s = await stat(articlesDir);
    if (!s.isDirectory()) {
      throw new Error(`Articles path is not a directory: ${articlesDir}`);
    }
    entries = await readdir(articlesDir);
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e && e.code === "ENOENT") {
      throw new Error(`Articles directory not found: ${articlesDir}`);
    }
    throw err;
  }

  const mdFiles = entries.filter((f) => f.toLowerCase().endsWith(".md")).sort();
  const files: MarkdownFile[] = [];
  for (const filename of mdFiles) {
    const raw = await readFile(resolve(articlesDir, filename), "utf8");
    files.push({ source: filename, raw });
  }
  return files;
}
