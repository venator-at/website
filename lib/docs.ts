import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "content/learn");

export interface DocMeta {
  title: string;
  description: string;
  category: string;
  order: number;
}

export interface Doc {
  slug: string;
  meta: DocMeta;
  content: string;
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
