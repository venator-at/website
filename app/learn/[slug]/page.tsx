import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDocBySlug, getDocSlugs, getAllDocs, extractToc } from "@/lib/docs";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { ArrowLeft, ChevronRight, Clock, BookOpen, Hash } from "lucide-react";
import "highlight.js/styles/github-dark.css";

// Next.js static paths generator
export async function generateStaticParams() {
  const slugs = getDocSlugs();
  return slugs.map((file) => ({
    slug: file.replace(/\.md$/, ""),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) return {};

  const title = `${doc.meta.title} | Venator Docs`;
  const description = doc.meta.description;
  const keywords = doc.meta.keywords ?? doc.meta.category;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Venator",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);

  if (!doc) {
    return notFound();
  }

  const allDocs = getAllDocs();
  const currentIndex = allDocs.findIndex((d) => d.slug === slug);
  const nextDoc =
    currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;

  const toc = extractToc(doc.content);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-60 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute -right-60 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/90 backdrop-blur-md shrink-0">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/learn"
              className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Übersicht
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Venator"
                width={22}
                height={22}
                className="rounded-md"
              />
              <span className="text-sm font-semibold text-slate-200">Docs</span>
            </div>
          </div>
          {/* Reading time pill */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {doc.readingTime} Min. Lesezeit
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-12 lg:flex lg:gap-12">
        {/* Left Sidebar – Article list (Desktop) */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Alle Artikel
            </h4>
            <div className="space-y-1 border-l border-white/10">
              {allDocs.map((d) => {
                const isActive = d.slug === slug;
                return (
                  <Link
                    key={d.slug}
                    href={`/learn/${d.slug}`}
                    className={`block border-l-2 py-1.5 pl-4 text-sm transition-colors ${
                      isActive
                        ? "border-cyan-400 text-cyan-400 font-medium"
                        : "border-transparent text-slate-400 hover:text-slate-100 hover:border-white/20"
                    }`}
                  >
                    {d.meta.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Article Content */}
        <main className="flex-1 min-w-0">
          <div className="mb-8">
            <div className="inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400 mb-4">
              {doc.meta.category}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl mb-4">
              {doc.meta.title}
            </h1>
            <p className="text-lg text-slate-400">{doc.meta.description}</p>

            {/* Meta row */}
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {doc.readingTime} Min. Lesezeit
              </span>
              {toc.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Hash className="h-4 w-4" />
                  {toc.length} Abschnitte
                </span>
              )}
            </div>
          </div>

          {/* Inline TOC for mobile / when no right sidebar */}
          {toc.length >= 3 && (
            <nav className="mb-10 rounded-xl border border-white/8 bg-slate-900/40 p-5 xl:hidden">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Inhalt
              </h4>
              <ul className="space-y-2">
                {toc.map((entry) => (
                  <li
                    key={entry.id}
                    className={entry.level === 3 ? "pl-4" : ""}
                  >
                    <a
                      href={`#${entry.id}`}
                      className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <article className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10 prose-code:text-fuchsia-300 prose-p:text-slate-300 prose-li:text-slate-300 prose-table:text-slate-300 prose-th:text-slate-200 prose-td:border-white/10 prose-th:border-white/10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeSlug]}
              components={{
                blockquote: ({ node: _, ...props }) => (
                  <blockquote
                    className="border-l-4 border-cyan-500 bg-cyan-500/10 px-4 py-3 rounded-r-lg not-italic text-sm text-cyan-100"
                    {...props}
                  />
                ),
                h2: ({ node: _, ...props }) => (
                  <h2
                    className="text-2xl font-semibold mt-10 mb-4 pb-2 border-b border-white/10 text-slate-100 scroll-mt-20"
                    {...props}
                  />
                ),
                h3: ({ node: _, ...props }) => (
                  <h3
                    className="text-xl font-medium mt-8 mb-3 text-slate-100 scroll-mt-20"
                    {...props}
                  />
                ),
                table: ({ node: _, ...props }) => (
                  <div className="overflow-x-auto my-6">
                    <table
                      className="w-full text-sm border-collapse"
                      {...props}
                    />
                  </div>
                ),
                th: ({ node: _, ...props }) => (
                  <th
                    className="text-left py-2 px-3 bg-slate-800/60 border border-white/10 font-semibold text-slate-200 text-xs uppercase tracking-wide"
                    {...props}
                  />
                ),
                td: ({ node: _, ...props }) => (
                  <td
                    className="py-2 px-3 border border-white/10 text-slate-300"
                    {...props}
                  />
                ),
              }}
            >
              {doc.content}
            </ReactMarkdown>
          </article>

          {/* Prev / Next Navigation */}
          <div className="mt-16 pt-8 border-t border-white/10 grid sm:grid-cols-2 gap-4">
            {prevDoc ? (
              <Link
                href={`/learn/${prevDoc.slug}`}
                className="group flex flex-col rounded-xl border border-white/8 bg-slate-900/40 p-5 transition-colors hover:bg-white/5 hover:border-white/20"
              >
                <div className="text-xs text-slate-500 mb-1">← Vorheriger Artikel</div>
                <div className="text-base font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                  {prevDoc.meta.title}
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextDoc ? (
              <Link
                href={`/learn/${nextDoc.slug}`}
                className="group flex flex-col items-end rounded-xl border border-white/8 bg-slate-900/40 p-5 transition-colors hover:bg-white/5 hover:border-white/20"
              >
                <div className="text-xs text-slate-500 mb-1">Nächster Artikel →</div>
                <div className="text-base font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors text-right">
                  {nextDoc.meta.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>

          {/* Back to overview CTA */}
          <div className="mt-8 flex justify-center">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
            >
              <BookOpen className="h-4 w-4" />
              Alle Artikel ansehen
            </Link>
          </div>
        </main>

        {/* Right Sidebar – TOC (large screens) */}
        {toc.length >= 3 && (
          <aside className="hidden xl:block w-52 shrink-0">
            <div className="sticky top-24">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Inhalt
              </h4>
              <ul className="space-y-2 border-l border-white/10">
                {toc.map((entry) => (
                  <li key={entry.id}>
                    <a
                      href={`#${entry.id}`}
                      className={`block border-l-2 border-transparent py-1 text-sm text-slate-500 hover:text-slate-200 hover:border-white/20 transition-colors ${
                        entry.level === 3 ? "pl-6" : "pl-4"
                      }`}
                    >
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
