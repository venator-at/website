import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDocBySlug, getDocSlugs, getAllDocs } from "@/lib/docs";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ChevronRight } from "lucide-react";
import "highlight.js/styles/github-dark.css"; // Basic highlighter theme

// Next.js static paths generator
export async function generateStaticParams() {
  const slugs = getDocSlugs();
  return slugs.map((file) => ({
    slug: file.replace(/\.md$/, ""),
  }));
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);

  if (!doc) {
    return notFound();
  }

  const allDocs = getAllDocs();
  const currentIndex = allDocs.findIndex((d) => d.slug === slug);
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/90 backdrop-blur-md shrink-0">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/learn" className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300">
              <ArrowLeft className="h-3.5 w-3.5" />
              Übersicht
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Venator" width={22} height={22} className="rounded-md" />
              <span className="text-sm font-semibold text-slate-200">Docs</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-12 lg:flex lg:gap-12">
        {/* Sidebar Nav (Desktop) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
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
          </div>

          <article className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10 prose-code:text-fuchsia-300 prose-p:text-slate-300 prose-li:text-slate-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-cyan-500 bg-cyan-500/10 px-4 py-3 rounded-r-lg not-italic text-sm text-cyan-100" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-semibold mt-10 mb-4 pb-2 border-b border-white/10 text-slate-100" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-medium mt-8 mb-3 text-slate-100" {...props} />
                ),
              }}
            >
              {doc.content}
            </ReactMarkdown>
          </article>

          {/* Next Article Navigation */}
          {nextDoc && (
            <div className="mt-16 pt-8 border-t border-white/10">
              <h4 className="text-sm text-slate-500 mb-4">Nächster Artikel</h4>
              <Link
                href={`/learn/${nextDoc.slug}`}
                className="group flex items-center justify-between rounded-xl border border-white/8 bg-slate-900/40 p-5 transition-colors hover:bg-white/5 hover:border-white/20"
              >
                <div>
                  <div className="text-xs text-slate-500 mb-1">{nextDoc.meta.category}</div>
                  <div className="text-lg font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {nextDoc.meta.title}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-cyan-400" />
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
