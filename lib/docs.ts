import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "content/learn");

export interface DocMeta {
  title: string;
  description: string;
  category: string;
  order: number;
  keywords?: string;
}

export interface Doc {
  slug: string;
  meta: DocMeta;
  content: string;
  readingTime: number; // minutes
}

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export function getReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function extractToc(content: string): TocEntry[] {
  const lines = content.split("\n");
  const toc: TocEntry[] = [];
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h2) {
      const text = h2[1].trim();
      toc.push({ id: slugifyHeading(text), text, level: 2 });
    } else if (h3) {
      const text = h3[1].trim();
      toc.push({ id: slugifyHeading(text), text, level: 3 });
    }
  }
  return toc;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-äöüß]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getDocSlugs() {
  if (!fs.existsSync(contentDirectory)) return [];
  return fs.readdirSync(contentDirectory).filter((file) => file.endsWith(".md"));
}

export function getDocBySlug(slug: string): Doc | null {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = path.join(contentDirectory, `${realSlug}.md`);
  
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug: realSlug,
    meta: data as DocMeta,
    content,
    readingTime: getReadingTime(content),
  };
}

export function getAllDocs() {
  const slugs = getDocSlugs();
  const docs = slugs
    .map((slug) => getDocBySlug(slug))
    .filter((doc): doc is Doc => doc !== null)
    .sort((a, b) => (a.meta.order || 99) - (b.meta.order || 99));
  
  return docs;
}
