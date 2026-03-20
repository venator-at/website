# CLAUDE.md — Architecture Advisor Platform

## Projektübersicht

Eine Webanwendung, die Anfänger und Junior-Entwickler dabei unterstützt, komplexe Softwareprojekte strukturiert zu planen. Nutzer geben eine Projektidee ein und werden durch einen geführten Prozess geführt, der ihnen hilft, die passende Architektur und Technologien auszuwählen — inklusive verständlicher Begründungen und einer interaktiven visuellen Darstellung der Gesamtarchitektur.

**Arbeitstitel:** Venator

---

## Core Features

### 1. Projektidee erfassen
- Nutzer gibt eine Freitext-Beschreibung ihrer Projektidee ein
- Optional: Auswahl von Projekttyp (Web App, Mobile App, API, SaaS, etc.)
- Optional: Angabe von Erfahrungslevel und Budget-Rahmen

### 2. Strukturierter Planungs-Workflow
- Wizard-artiger Prozess, der das Projekt in Komponenten zerlegt:
  - **Backend** (z. B. Node.js, Python/FastAPI, Go)
  - **Datenbank** (z. B. PostgreSQL, MongoDB, Firebase Firestore)
  - **Hosting / Infrastruktur** (z. B. Vercel, Railway, AWS, Fly.io)
  - **Authentifizierung** (z. B. Supabase Auth, Auth.js, Clerk)
  - **Frontend-Framework** (z. B. Next.js, Nuxt, SvelteKit)
  - **Storage** (z. B. S3, Cloudflare R2, Supabase Storage)
  - **E-Mail / Notifications** (z. B. Resend, SendGrid, Twilio)
  - **Payments** (z. B. Stripe, Lemon Squeezy) — optional
  - **Monitoring / Logging** (z. B. Sentry, Logtail, PostHog)

### 3. KI-gestützte Empfehlungen
- Für jede Komponente werden 2–3 konkrete Optionen vorgeschlagen
- Jede Option enthält:
  - Kurzbeschreibung (laienverständlich)
  - Warum empfohlen (Reasoning)
  - Vorteile
  - Nachteile
  - Mögliche Risiken / Fallstricke
  - Schwierigkeitsgrad für Anfänger
  - Offizieller Link / Dokumentation
- KI berücksichtigt die Projektbeschreibung beim Ranking der Optionen

### 4. Interaktiver Architektur-Graph
- Nach der Planung wird die Architektur als visueller Graph dargestellt
- Technologie: **React Flow** (`@xyflow/react`)
- Jeder Node = eine Komponente (z. B. "Next.js Frontend", "Supabase DB")
- Edges zeigen die Beziehungen/Datenflüsse zwischen Komponenten
- Nodes sind klickbar → öffnet Side-Panel mit Details zur Komponente
- Graph ist exportierbar (PNG / SVG)

### 5. Umsetzungshilfen (Output)
- Generiertes Markdown-Dokument mit der gesamten Architektur-Entscheidung
- Empfohlene nächste Schritte (nummerierte Liste mit Links)
- Optionaler Starter-Code / Repository-Template-Empfehlungen (z. B. GitHub-Links)
- `tech-stack.md` zum Download mit allen gewählten Technologien

---

## Tech Stack (dieses Projekts)

| Bereich | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Sprache | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| UI-Komponenten | shadcn/ui |
| KI-Integration | Anthropic Claude API (claude-sonnet-4-5 oder neuer) |
| Graph-Visualisierung | React Flow (`@xyflow/react`) |
| Authentifizierung | Supabase Auth |
| Datenbank | Supabase (PostgreSQL) |
| ORM | Supabase JS Client (kein Prisma initially) |
| Hosting | Vercel |
| State Management | Zustand oder React Context (minimal) |
| Formulare | React Hook Form + Zod |
| Icons | Lucide React |
| Animationen | Framer Motion (sparsam) |
| Markdown Rendering | `react-markdown` + `rehype-highlight` |

---

## Projektstruktur

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/
│   │   ├── dashboard/        # Übersicht gespeicherter Architekturen
│   │   ├── new/              # Neues Projekt starten (Wizard)
│   │   └── project/[id]/     # Projekt-Detailseite mit Graph
│   ├── api/
│   │   ├── ai/
│   │   │   └── analyze/      # Claude API: Projektanalyse
│   │   │   └── recommend/    # Claude API: Komponentenempfehlungen
│   │   └── projects/         # CRUD für gespeicherte Projekte
│   ├── layout.tsx
│   └── page.tsx              # Landing Page
├── components/
│   ├── ui/                   # shadcn/ui Basis-Komponenten
│   ├── wizard/               # Wizard-Steps (ProjectInput, ComponentSelector, etc.)
│   ├── graph/                # React Flow Graph-Komponenten
│   │   ├── ArchitectureGraph.tsx
│   │   ├── ComponentNode.tsx
│   │   └── ComponentDetailPanel.tsx
│   ├── recommendations/      # Empfehlungskarten-Komponenten
│   └── layout/               # Header, Sidebar, etc.
├── lib/
│   ├── ai/
│   │   ├── prompts.ts        # System-Prompts für Claude
│   │   └── analyzer.ts       # Anthropic SDK Wrapper
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils.ts
├── types/
│   ├── project.ts
│   └── architecture.ts
└── hooks/
    ├── useWizard.ts
    └── useArchitectureGraph.ts
```

---

## Datenmodell (Supabase)

### `projects`
```sql
id          uuid PRIMARY KEY
user_id     uuid REFERENCES auth.users
title       text NOT NULL
description text NOT NULL
project_type text  -- 'web-app' | 'api' | 'mobile' | 'saas' | etc.
experience_level text  -- 'beginner' | 'junior' | 'mid'
budget_level text  -- 'free' | 'low' | 'medium' | 'high'
created_at  timestamptz
updated_at  timestamptz
```

### `architecture_decisions`
```sql
id          uuid PRIMARY KEY
project_id  uuid REFERENCES projects
component   text  -- 'backend' | 'database' | 'hosting' | etc.
chosen_option text  -- gewählte Technologie
reasoning   text  -- Begründung (von KI generiert)
alternatives jsonb  -- Array der anderen Optionen
created_at  timestamptz
```

### `architecture_graphs`
```sql
id          uuid PRIMARY KEY
project_id  uuid REFERENCES projects
nodes       jsonb  -- React Flow Node-Array
edges       jsonb  -- React Flow Edge-Array
created_at  timestamptz
updated_at  timestamptz
```

---

## KI-Integration (Claude API)

### Verwendetes Modell
`claude-sonnet-4-5` (oder neueste verfügbare Version aus `claude-sonnet-*`)

### API-Endpunkte

#### `POST /api/ai/analyze`
- Input: `{ description: string, projectType: string, experienceLevel: string }`
- Output: Aufgeschlüsselte Projektkomponenten + initiales Verständnis
- Streaming: Ja (via `ReadableStream`)

#### `POST /api/ai/recommend`
- Input: `{ component: string, projectContext: object }`
- Output: Array von 2–3 Technologie-Optionen mit vollständiger Begründung
- Output-Format: Strukturiertes JSON (via Anthropic's structured output)

### Prompt-Strategie
- System-Prompt: Klar definieren, dass Claude als "Senior Software Architect for beginners" agiert
- Alle Erklärungen müssen laienverständlich sein (kein Fachjargon ohne Erklärung)
- Immer konkrete Vor-/Nachteile und Begründungen liefern
- JSON-Output für Empfehlungen strikt validieren (Zod)

---

## Wichtige Designprinzipien

1. **Anfänger-First**: Alle Texte, Erklärungen und UI müssen für jemanden ohne Vorerfahrung verständlich sein
2. **Keine Überforderung**: Jeweils nur eine Entscheidung auf einmal (Wizard-Prinzip)
3. **Warum vor Was**: Begründungen sind wichtiger als die bloßen Empfehlungen
4. **Progressive Disclosure**: Fortgeschrittene Details (z. B. Konfigurationsoptionen) nur auf Anfrage anzeigen
5. **Mobile-First UI**: Tailwind responsive, funktioniert auf allen Geräten
6. **Kein Lock-in**: Nutzer können Entscheidungen jederzeit revidieren

---

## Umgebungsvariablen (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Entwicklungsreihenfolge (empfohlen)

1. **Setup**: Next.js + TypeScript + Tailwind + shadcn/ui initialisieren
2. **Auth**: Supabase Auth mit Login/Signup-Flows
3. **Landing Page**: Marketing-Seite mit CTA
4. **Wizard – Schritt 1**: Projekt-Eingabe (Beschreibung, Typ, Level)
5. **KI-Analyse**: Claude API Integration, erstes Prompt-Engineering
6. **Komponentenauswahl**: Wizard-Steps für jede Architekturkomponente
7. **Empfehlungskarten**: UI für Optionen mit Pros/Cons
8. **Graph-Visualisierung**: React Flow Integration
9. **Projekt speichern**: Supabase CRUD
10. **Dashboard**: Übersicht gespeicherter Architekturen
11. **Export-Funktion**: Markdown / PNG Download
12. **Polish**: Animationen, Error States, Loading States

---

## Code-Konventionen

- **TypeScript strict mode** — keine `any`-Types
- **Server Components by default** — nur `'use client'` wenn notwendig
- **Server Actions** für Formulare bevorzugen (nicht API-Routes wenn möglich)
- **Zod** für alle externen Daten (API-Responses, Formulare)
- **Error Boundaries** für kritische Komponenten
- Komponenten-Dateien: PascalCase (`ComponentDetailPanel.tsx`)
- Utility-Dateien: camelCase (`graphUtils.ts`)
- Alle Strings, Labels, Kommentare: **Englisch** (Code), UI-Texte: Deutsch oder i18n-ready

---

## Bekannte Einschränkungen / Entscheidungen

- **Kein Prisma** initial — Supabase JS Client reicht für MVP
- **Kein Redis** — Supabase Realtime und Edge-Caching über Vercel ausreichend
- **Kein Custom Auth** — Supabase Auth abdeckt alle Anforderungen
- **React Flow** statt D3.js — bessere React-Integration, ausreichend für Use Case
- KI-Antworten werden **gecacht per Project-ID** um API-Kosten zu minimieren