import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BookOpen,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Layers,
  Lightbulb,
  MessageCircle,
  Network,
  Rocket,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

// ─── Section anchor helper ──────────────────────────────────────────────────

function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="-mt-20 block pt-20" />;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-60 top-0 h-[600px] w-[600px] rounded-full bg-cyan-500/6 blur-[140px]" />
        <div className="absolute -right-60 bottom-0 h-[600px] w-[600px] rounded-full bg-fuchsia-500/6 blur-[140px]" />
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-violet-500/4 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Venator" width={22} height={22} className="rounded-md" />
              <span className="text-sm font-semibold text-slate-200">Venator</span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                Docs
              </span>
            </div>
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            <a href="#vibe-coding" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              Vibe Coding
            </a>
            <a href="#how-it-works" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              Wie es funktioniert
            </a>
            <a href="#graph" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              Der Graph
            </a>
            <a href="#concepts" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              Konzepte
            </a>
            <a href="#faq" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              FAQ
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex gap-12 py-16">
          {/* ── Sticky TOC ── */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 space-y-1">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                Inhalt
              </p>
              {[
                { href: "#vibe-coding", label: "Was ist Vibe Coding?" },
                { href: "#how-it-works", label: "Wie Venator funktioniert" },
                { href: "#first-project", label: "Dein erstes Projekt" },
                { href: "#graph", label: "Den Graph lesen" },
                { href: "#concepts", label: "Tech-Konzepte" },
                { href: "#chat-mode", label: "Freie Fragen stellen" },
                { href: "#tips", label: "Tipps für Anfänger" },
                { href: "#faq", label: "Häufige Fragen" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-1.5 text-xs text-slate-500 transition-all hover:bg-white/5 hover:text-slate-300"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="min-w-0 flex-1 space-y-20">
            {/* Hero */}
            <section>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/8 px-3 py-1.5 text-xs text-cyan-400 mb-6">
                <BookOpen className="h-3.5 w-3.5" />
                Lernressourcen & Dokumentation
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl text-balance mb-4">
                Lerne, wie{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                  modernes Bauen
                </span>{" "}
                funktioniert
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
                Von Vibe Coding bis hin zu konkreten Architekturentscheidungen — hier findest du alles,
                was du brauchst, um deine erste Web-App erfolgreich zu planen und umzusetzen.
              </p>
            </section>

            {/* ── 1. Vibe Coding ── */}
            <section>
              <SectionAnchor id="vibe-coding" />
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10">
                  <Sparkles className="h-4.5 w-4.5 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-50">Was ist Vibe Coding?</h2>
              </div>

              <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6 mb-6">
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-slate-100">Vibe Coding</strong> ist ein moderner Ansatz zum
                  Softwareentwickeln, bei dem du als Entwickler weniger Code tippst und mehr mit
                  KI-Werkzeugen zusammenarbeitest. Statt jede Zeile selbst zu schreiben, beschreibst du
                  was du willst — und die KI setzt es um.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Das Konzept wurde 2025 von Andrej Karpathy (ehemaliger Tesla AI-Chef) geprägt: Du
                  navigierst, die KI baut. Du hast die Vision, die KI die Implementierung.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <MessageCircle className="h-4 w-4" />,
                    title: "Beschreiben statt tippen",
                    text: "Du erklärst der KI in normaler Sprache, was du bauen willst. Kein Programmiercode nötig.",
                    color: "cyan",
                  },
                  {
                    icon: <Zap className="h-4 w-4" />,
                    title: "Schneller iterieren",
                    text: "Ideen werden in Minuten statt Wochen zu funktionierendem Code — ideal für Prototypen.",
                    color: "fuchsia",
                  },
                  {
                    icon: <Lightbulb className="h-4 w-4" />,
                    title: "Verstehen, nicht nur nutzen",
                    text: "Gute Vibe Coder verstehen, was die KI macht — so können sie Fehler erkennen und korrigieren.",
                    color: "violet",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-white/8 bg-white/3 p-4"
                  >
                    <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                      card.color === "cyan"
                        ? "border border-cyan-400/20 bg-cyan-500/10 text-cyan-400"
                        : card.color === "fuchsia"
                        ? "border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-400"
                        : "border border-violet-400/20 bg-violet-500/10 text-violet-400"
                    }`}>
                      {card.icon}
                    </div>
                    <h3 className="mb-1.5 text-sm font-semibold text-slate-200">{card.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.text}</p>
                  </div>
                ))}
              </div>

              {/* Warning callout */}
              <div className="mt-6 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-500/8 p-4">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300 mb-1">Wichtig zu verstehen</p>
                  <p className="text-xs text-amber-200/70 leading-relaxed">
                    Vibe Coding ist am effektivsten, wenn du die Grundlagen der Architektur verstehst.
                    Du musst keinen Code schreiben können — aber du solltest wissen, welche Teile deine
                    App braucht und warum. Genau dabei hilft dir Venator.
                  </p>
                </div>
              </div>
            </section>

            {/* ── 2. How Venator Works ── */}
            <section>
              <SectionAnchor id="how-it-works" />
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10">
                  <Network className="h-4.5 w-4.5 text-fuchsia-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-50">Wie Venator funktioniert</h2>
              </div>

              <p className="text-slate-400 leading-relaxed mb-8">
                Venator ist dein persönlicher Senior-Softwarearchitekt. Du beschreibst deine App-Idee,
                und Venator analysiert sie mit KI und gibt dir eine konkrete, begründete
                Architekturempfehlung — visuell dargestellt als interaktiver Graph.
              </p>

              <div className="space-y-4">
                {[
                  {
                    step: "01",
                    title: "Idee eingeben",
                    text: "Beschreibe deine App-Idee in einfachen Worten. Je mehr Details, desto besser die Empfehlung. Du kannst auch Projekttyp, Erfahrungslevel und Budget angeben.",
                    example: '"Ich möchte einen Marktplatz für gebrauchte Bücher bauen, wo Nutzer kaufen und verkaufen können."',
                    color: "cyan",
                  },
                  {
                    step: "02",
                    title: "KI analysiert dein Projekt",
                    text: "Venator's KI analysiert deine Beschreibung und identifiziert alle technischen Komponenten, die deine App braucht — von Frontend bis Datenbank, von Authentifizierung bis Hosting.",
                    color: "violet",
                  },
                  {
                    step: "03",
                    title: "Architektur-Graph entsteht",
                    text: "Die Ergebnisse werden als interaktiver, visueller Graph dargestellt. Jeder Block ist eine Komponente deiner App. Die Verbindungen zeigen, wie die Teile miteinander kommunizieren.",
                    color: "fuchsia",
                  },
                  {
                    step: "04",
                    title: "Details & Begründungen lesen",
                    text: "Klicke auf jeden Block, um zu verstehen, warum diese Technologie empfohlen wird, welche Alternativen es gibt, und welche Risiken zu beachten sind.",
                    color: "amber",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-5 rounded-2xl border border-white/8 bg-slate-900/40 p-5"
                  >
                    <div className={`shrink-0 text-2xl font-bold font-mono ${
                      item.color === "cyan" ? "text-cyan-500/40" :
                      item.color === "violet" ? "text-violet-500/40" :
                      item.color === "fuchsia" ? "text-fuchsia-500/40" :
                      "text-amber-500/40"
                    }`}>
                      {item.step}
                    </div>
                    <div className="min-w-0">
                      <h3 className="mb-1.5 text-base font-semibold text-slate-100">{item.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
                      {item.example && (
                        <div className="mt-3 rounded-lg border border-white/8 bg-white/3 px-3 py-2">
                          <p className="text-xs text-slate-500 italic">{item.example}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 3. First Project ── */}
            <section>
              <SectionAnchor id="first-project" />
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-green-400/20 bg-green-500/10">
                  <Rocket className="h-4.5 w-4.5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-50">Dein erstes Projekt starten</h2>
              </div>

              <div className="rounded-2xl border border-white/8 bg-slate-900/60 overflow-hidden mb-6">
                <div className="border-b border-white/8 bg-white/3 px-5 py-3 flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs text-slate-500 font-mono">Schritt-für-Schritt Anleitung</span>
                </div>
                <div className="p-5 space-y-5">
                  {[
                    {
                      num: 1,
                      title: 'Geh zum Dashboard',
                      text: 'Klicke oben links auf "Dashboard". Dort findest du das Chat-Eingabefeld.',
                    },
                    {
                      num: 2,
                      title: 'Wähle den Modus "Projektplanung"',
                      text: 'Stelle sicher, dass der Modus Projektplanung ausgewählt ist (der cyan-farbene Button). Das ist der Standard.',
                    },
                    {
                      num: 3,
                      title: "Beschreibe deine App-Idee",
                      text: "Schreibe eine klare Beschreibung was deine App machen soll. Nutze die Starter-Vorlagen unten als Inspiration, wenn du noch keine Idee hast.",
                    },
                    {
                      num: 4,
                      title: "Projektdetails angeben",
                      text: 'Im nächsten Dialog kannst du Projekttyp, Erfahrungslevel und Budget angeben. Als Anfänger wähle "Anfänger" und "Kostenlos".',
                    },
                    {
                      num: 5,
                      title: "Graph erkunden",
                      text: "Die KI generiert deinen Architektur-Graph. Klicke auf jeden Knoten, um mehr Details zu erfahren. Du kannst den Graph auch als PNG exportieren.",
                    },
                  ].map((step) => (
                    <div key={step.num} className="flex gap-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-xs font-bold text-cyan-400">
                        {step.num}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200 mb-0.5">{step.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-green-400/20 bg-green-500/8 p-4">
                <Rocket className="h-4 w-4 shrink-0 text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-300 mb-1">Profi-Tipp: Sei spezifisch</p>
                  <p className="text-xs text-green-200/70 leading-relaxed">
                    Statt "ich will eine App bauen" schreibe "ich will eine Web-App für Haustierbesitzer bauen,
                    wo Nutzer Tierärzte in ihrer Nähe finden und Termine buchen können, mit Bewertungssystem."
                    Je mehr Details, desto präzisere Empfehlungen bekommst du.
                  </p>
                </div>
              </div>
            </section>

            {/* ── 4. Reading the Graph ── */}
            <section>
              <SectionAnchor id="graph" />
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
                  <GitBranch className="h-4.5 w-4.5 text-violet-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-50">Den Architektur-Graph lesen</h2>
              </div>

              <p className="text-slate-400 leading-relaxed mb-6">
                Der Graph ist das Herzstück von Venator. Jeder farbige Block repräsentiert eine
                Technologie oder einen Service, den deine App braucht. Die Linien zwischen den
                Blöcken zeigen, wie Daten fließen.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Frontend", color: "bg-blue-500/20 text-blue-300 border-blue-400/30", desc: "Die Benutzeroberfläche — was der Nutzer sieht und mit dem er interagiert (z.B. Next.js, React)." },
                  { label: "Backend", color: "bg-green-500/20 text-green-300 border-green-400/30", desc: "Die Serverlogik — verarbeitet Anfragen, führt Berechnungen durch (z.B. Node.js, FastAPI)." },
                  { label: "Datenbank", color: "bg-amber-500/20 text-amber-300 border-amber-400/30", desc: "Speichert alle Daten dauerhaft — Nutzerprofile, Produkte, Nachrichten (z.B. PostgreSQL)." },
                  { label: "Auth", color: "bg-red-500/20 text-red-300 border-red-400/30", desc: "Kümmert sich um Login, Registrierung und Sicherheit (z.B. Supabase Auth, Clerk)." },
                  { label: "Hosting", color: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30", desc: "Wo deine App lebt — der Server im Internet (z.B. Vercel, Railway, AWS)." },
                  { label: "Storage", color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30", desc: "Speichert Dateien, Bilder, Videos (z.B. AWS S3, Cloudflare R2)." },
                  { label: "Email", color: "bg-orange-500/20 text-orange-300 border-orange-400/30", desc: "Sendet E-Mails an Nutzer — Willkommens-Mails, Passwort-Reset (z.B. Resend)." },
                  { label: "Payments", color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30", desc: "Verarbeitet Zahlungen sicher (z.B. Stripe, Lemon Squeezy)." },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3 rounded-xl border border-white/8 bg-white/3 p-4">
                    <span className={`inline-flex h-fit shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${item.color}`}>
                      {item.label}
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-500" />
                  Was bedeuten die Schwierigkeitsgrade?
                </h3>
                <div className="space-y-2.5">
                  {[
                    { level: "Anfänger", color: "text-green-400", desc: "Gut dokumentiert, große Community, viele Tutorials. Perfekt für deinen ersten Start." },
                    { level: "Fortgeschritten", color: "text-amber-400", desc: "Mehr Konfiguration nötig, aber lernbar. Gut wenn du schon etwas Erfahrung hast." },
                    { level: "Experte", color: "text-red-400", desc: "Komplex, braucht tiefes Verständnis. Nur empfehlenswert wenn du weißt was du tust." },
                  ].map((item) => (
                    <div key={item.level} className="flex items-start gap-3">
                      <span className={`shrink-0 text-xs font-semibold w-24 ${item.color}`}>{item.level}</span>
                      <span className="text-xs text-slate-500 leading-relaxed">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 5. Tech Concepts ── */}
            <section>
              <SectionAnchor id="concepts" />
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10">
                  <Cpu className="h-4.5 w-4.5 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-50">Wichtige Tech-Konzepte</h2>
              </div>

              <p className="text-slate-400 leading-relaxed mb-8">
                Du musst kein Programmierer sein, aber diese Konzepte helfen dir, die Empfehlungen
                besser zu verstehen.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: <Globe className="h-4 w-4" />,
                    title: "Frontend vs. Backend",
                    content: (
                      <>
                        <p className="text-sm text-slate-400 leading-relaxed mb-3">
                          <strong className="text-slate-300">Frontend</strong> ist alles, was der Nutzer sieht:
                          Buttons, Formulare, Seiten. Es läuft im Browser.
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          <strong className="text-slate-300">Backend</strong> ist der unsichtbare Teil:
                          Server, Logik, Datenbankzugriffe. Es läuft auf einem Server irgendwo im Internet.
                        </p>
                        <div className="mt-3 rounded-lg bg-white/3 border border-white/8 px-4 py-3 font-mono text-xs text-slate-500">
                          Browser {"→"} Frontend (React) {"→"} Backend (Node.js) {"→"} Datenbank (PostgreSQL)
                        </div>
                      </>
                    ),
                  },
                  {
                    icon: <Database className="h-4 w-4" />,
                    title: "SQL vs. NoSQL Datenbanken",
                    content: (
                      <>
                        <p className="text-sm text-slate-400 leading-relaxed mb-3">
                          <strong className="text-slate-300">SQL-Datenbanken</strong> (PostgreSQL, MySQL) speichern
                          Daten in Tabellen — wie eine Excel-Tabelle. Sehr strukturiert, gut für
                          komplexe Beziehungen zwischen Daten.
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          <strong className="text-slate-300">NoSQL-Datenbanken</strong> (MongoDB, Firestore)
                          speichern Daten als flexible Dokumente. Einfacher zu starten, aber weniger
                          strukturiert.
                        </p>
                        <div className="mt-3 flex gap-2">
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/8 px-2.5 py-1 text-[11px] text-cyan-400">
                            Für Anfänger: PostgreSQL via Supabase
                          </span>
                        </div>
                      </>
                    ),
                  },
                  {
                    icon: <Shield className="h-4 w-4" />,
                    title: "Authentifizierung & Autorisierung",
                    content: (
                      <>
                        <p className="text-sm text-slate-400 leading-relaxed mb-3">
                          <strong className="text-slate-300">Authentifizierung</strong> beantwortet die Frage:
                          "Wer bist du?" — Login, Registrierung, Passwörter.
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          <strong className="text-slate-300">Autorisierung</strong> beantwortet: "Was darfst du?" —
                          Welche Seiten und Daten darf dieser Nutzer sehen?
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed mt-3">
                          Statt selbst ein Auth-System zu bauen (sehr komplex!), empfehlen wir fertige
                          Lösungen wie Supabase Auth oder Clerk.
                        </p>
                      </>
                    ),
                  },
                  {
                    icon: <Rocket className="h-4 w-4" />,
                    title: "Hosting & Deployment",
                    content: (
                      <>
                        <p className="text-sm text-slate-400 leading-relaxed mb-3">
                          Deine App läuft lokal auf deinem Computer. Damit andere sie nutzen können,
                          muss sie auf einem Server im Internet "deployed" werden.
                        </p>
                        <div className="space-y-2">
                          {[
                            { name: "Vercel", desc: "Perfekt für Next.js Apps. Kostenlos starten, extrem einfach." },
                            { name: "Railway", desc: "Gut für Backend-Services und Datenbanken. Günstig." },
                            { name: "Supabase", desc: "Datenbank + Auth + Storage in einem. Kostenlos bis 500MB." },
                          ].map((h) => (
                            <div key={h.name} className="flex gap-2.5 rounded-lg bg-white/3 border border-white/8 px-3 py-2">
                              <span className="shrink-0 text-xs font-semibold text-slate-300 w-20">{h.name}</span>
                              <span className="text-xs text-slate-500">{h.desc}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ),
                  },
                ].map((item) => (
                  <details
                    key={item.title}
                    className="group rounded-2xl border border-white/8 bg-slate-900/40 overflow-hidden"
                  >
                    <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 text-slate-200 hover:bg-white/3 transition-colors list-none">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400">
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.title}</span>
                      <svg
                        className="ml-auto h-4 w-4 shrink-0 text-slate-600 transition-transform group-open:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="border-t border-white/8 px-5 py-4">{item.content}</div>
                  </details>
                ))}
              </div>
            </section>

            {/* ── 6. Chat Mode ── */}
            <section>
              <SectionAnchor id="chat-mode" />
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10">
                  <MessageCircle className="h-4.5 w-4.5 text-fuchsia-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-50">Freie Fragen stellen</h2>
              </div>

              <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6">
                <p className="text-slate-300 leading-relaxed mb-4">
                  Neben dem Projektplanungs-Modus gibt es den{" "}
                  <strong className="text-fuchsia-300">Freie Frage</strong>-Modus. Hier kannst du der KI
                  alles fragen, ohne dass ein spezieller Architektur-Prompt verwendet wird.
                </p>
                <p className="text-slate-400 leading-relaxed mb-4">
                  Perfekt für:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  {[
                    '"Was ist der Unterschied zwischen REST und GraphQL?"',
                    '"Erkläre mir, wie JWT-Tokens funktionieren"',
                    '"Welches Framework soll ich für mein Projekt nehmen?"',
                    '"Wie funktioniert OAuth 2.0?"',
                    '"Was bedeutet serverless?"',
                    '"Erkläre mir das MVC-Pattern"',
                  ].map((q) => (
                    <div
                      key={q}
                      className="rounded-lg border border-fuchsia-400/15 bg-fuchsia-500/8 px-3 py-2 text-xs text-fuchsia-200/80 italic"
                    >
                      {q}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500">
                  Wechsle zwischen den Modi mit dem Toggle im Chat-Eingabefeld auf dem Dashboard.
                </p>
              </div>
            </section>

            {/* ── 7. Tips ── */}
            <section>
              <SectionAnchor id="tips" />
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-green-400/20 bg-green-500/10">
                  <Lightbulb className="h-4.5 w-4.5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-50">Tipps für Anfänger</h2>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    title: "Starte klein",
                    text: "Plane kein riesiges Produkt von Anfang an. Baue zuerst einen Prototyp mit den wichtigsten Features, und erweitere dann schrittweise.",
                    accent: "cyan",
                  },
                  {
                    title: "Verstehe deine Abhängigkeiten",
                    text: "Jeder Baustein in deinem Graph kostet Zeit und Geld. Starte mit so wenig Komponenten wie möglich. Füge nur hinzu, was du wirklich brauchst.",
                    accent: "violet",
                  },
                  {
                    title: "Wähle bewährte Technologien",
                    text: "Als Anfänger ist es besser, beliebte, gut dokumentierte Tools zu wählen. Next.js, Supabase, Vercel — diese haben riesige Communities und tausende Tutorials.",
                    accent: "fuchsia",
                  },
                  {
                    title: "Lese die Begründungen",
                    text: "Klicke auf jeden Knoten im Graph und lese die Begründung. Das Warum ist wichtiger als das Was. So lernst du, in Zukunft selbst bessere Entscheidungen zu treffen.",
                    accent: "amber",
                  },
                  {
                    title: "Nutze den Freie-Fragen-Modus",
                    text: "Wenn du etwas im Graph nicht verstehst, wechsle in den Freie-Fragen-Modus und frage die KI direkt. Sie erklärt alles in einfacher Sprache.",
                    accent: "green",
                  },
                ].map((tip, i) => (
                  <div
                    key={i}
                    className="flex gap-4 rounded-xl border border-white/8 bg-white/3 p-5"
                  >
                    <div className={`shrink-0 text-lg font-bold font-mono ${
                      tip.accent === "cyan" ? "text-cyan-500/50" :
                      tip.accent === "violet" ? "text-violet-500/50" :
                      tip.accent === "fuchsia" ? "text-fuchsia-500/50" :
                      tip.accent === "amber" ? "text-amber-500/50" :
                      "text-green-500/50"
                    }`}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-semibold text-slate-200">{tip.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{tip.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 8. FAQ ── */}
            <section>
              <SectionAnchor id="faq" />
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-400/20 bg-slate-500/10">
                  <MessageCircle className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-50">Häufige Fragen</h2>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: "Muss ich programmieren können, um Venator zu nutzen?",
                    a: "Nein! Venator ist speziell für Anfänger ohne Programmierkenntnisse gebaut. Du brauchst nur deine App-Idee — die KI macht die technische Analyse.",
                  },
                  {
                    q: "Wie viele Projekte kann ich erstellen?",
                    a: "Dein erster Projekt-Analyse ist kostenlos. Danach nutzt du Credits. Credits können in kleinen Paketen ab 5€ gekauft werden und verfallen nie.",
                  },
                  {
                    q: "Kann ich den Architektur-Graph exportieren?",
                    a: "Ja! Im Graph gibt es Export-Buttons oben rechts. Du kannst als PNG oder SVG exportieren und das Bild dann mit deinem Team teilen.",
                  },
                  {
                    q: "Sind die KI-Empfehlungen immer richtig?",
                    a: "Die KI macht sehr gute Empfehlungen basierend auf deiner Beschreibung, aber sie ist nicht unfehlbar. Lies immer die Begründungen und Risiken. Wenn du unsicher bist, stelle im Freie-Fragen-Modus gezielt nach.",
                  },
                  {
                    q: "Kann ich meine Architektur später ändern?",
                    a: "Du kannst jederzeit ein neues Projekt mit geänderten Anforderungen erstellen. Alle deine Projekte werden im Dashboard gespeichert und sind jederzeit zugänglich.",
                  },
                  {
                    q: "Was ist der Unterschied zwischen den zwei Chat-Modi?",
                    a: '"Projektplanung" analysiert deine App-Idee und erstellt einen visuellen Architektur-Graph. "Freie Frage" sendet deine Nachricht direkt an die KI ohne speziellen Architektur-Kontext — perfekt für allgemeine Technik-Fragen.',
                  },
                ].map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-white/8 bg-slate-900/40 overflow-hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-slate-200 hover:bg-white/3 transition-colors list-none">
                      {item.q}
                      <svg
                        className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-open:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="border-t border-white/8 px-5 py-4">
                      <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/8 to-fuchsia-500/8 p-8 text-center">
              <h2 className="text-2xl font-bold text-slate-50 mb-3">Bereit loszulegen?</h2>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Erstelle jetzt dein erstes Architektur-Diagramm — kostenlos und ohne Vorkenntnisse.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-6 py-3 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/70 hover:bg-cyan-500/30"
              >
                <Rocket className="h-4 w-4" />
                Zum Dashboard
              </Link>
            </section>

            {/* Footer spacing */}
            <div className="pb-8" />
          </main>
        </div>
      </div>
    </div>
  );
}
