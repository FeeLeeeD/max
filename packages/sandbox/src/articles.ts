import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

export interface ArticleFile {
  source: string;
  title: string;
  content: string;
}

// Pull the first H1 ("# ...") off the top of the file for the title; fall back
// to the filename stem so every article is guaranteed to have one.
function parseArticle(source: string, raw: string): ArticleFile {
  const normalized = raw.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  let title: string | null = null;
  let bodyStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() === "") continue;
    const match = line.match(/^#\s+(.+?)\s*$/);
    if (match) {
      title = match[1]!.trim();
      bodyStart = i + 1;
    }
    break;
  }

  if (title === null) {
    title = source.replace(/\.md$/i, "");
  }

  const content = lines.slice(bodyStart).join("\n").trim();

  return { source, title, content };
}

export async function loadArticles(articlesDir: string): Promise<ArticleFile[]> {
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
  const articles: ArticleFile[] = [];
  for (const filename of mdFiles) {
    const raw = await readFile(resolve(articlesDir, filename), "utf8");
    articles.push(parseArticle(filename, raw));
  }
  return articles;
}
