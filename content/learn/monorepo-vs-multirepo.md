---
title: "Monorepo vs Multi-Repo: Was ist besser?"
description: "Monorepo oder Multi-Repo? Vergleich beider Strategien für Code-Organisation mit konkreten Empfehlungen — wann du welchen Ansatz für dein Projekt wählen solltest."
category: "Architektur-Grundlagen"
order: 21
keywords: ["Monorepo", "Multi-Repo", "Turborepo", "Nx", "Code-Organisation"]
---

## Das Problem: Wie organisierst du mehrere Codebasen?

Dein Projekt wächst. Du hast ein Frontend, ein Backend, eine mobile App und vielleicht noch ein Shared-Package für gemeinsamen Code. Wie verwaltest du das?

Es gibt zwei grundlegende Strategien:

- **Monorepo**: Alles in einem einzigen Git-Repository
- **Multi-Repo** (auch Polyrepo): Jedes Projekt in einem separaten Repository

Beide haben echte Vor- und Nachteile. Es gibt keine universell "richtige" Antwort.

---

## Monorepo — alles an einem Ort

```
mein-projekt/              ← Ein einziges Git-Repo
├── apps/
│   ├── web/               ← Next.js Frontend
│   ├── mobile/            ← React Native App
│   └── api/               ← Node.js Backend
├── packages/
│   ├── ui/                ← Shared UI-Komponenten
│   ├── types/             ← Gemeinsame TypeScript-Types
│   └── utils/             ← Gemeinsame Hilfsfunktionen
├── package.json
└── turbo.json
```

### Die Vorteile des Monorepos

**1. Atomic Commits über mehrere Projekte**
```bash
# Eine Änderung in types/ betrifft web/ und api/
# Im Monorepo: Ein einziger Commit
git commit -m "feat: add OrderStatus type to shared package"
# web/ und api/ verwenden automatisch die neue Version
```

**2. Shared Code ohne Package-Publishing**
```typescript
// apps/web/src/app/page.tsx
import { Button } from '@mein-projekt/ui';       // kein npm publish nötig
import { formatCurrency } from '@mein-projekt/utils';
import type { Order } from '@mein-projekt/types';
```

**3. Einfacheres Refactoring**
Wenn du eine Funktion umbenennst, die in drei Projekten verwendet wird, änderst du sie an einem Ort — und deine IDE findet alle Verwendungen auf einmal.

**4. Einheitliche Tools und Konfiguration**
```
.eslintrc.js       → gilt für alle Projekte
tsconfig.base.json → gemeinsame TypeScript-Konfiguration
.prettierrc        → eine Formatierungs-Regel für alle
```

---

## Multi-Repo — klare Grenzen, klare Verantwortlichkeiten

```
github.com/mein-user/
├── frontend-repo/          ← Eigenes Git-Repo
├── backend-repo/           ← Eigenes Git-Repo
├── mobile-repo/            ← Eigenes Git-Repo
└── shared-ui-repo/         ← Eigenes Git-Repo (als npm package)
```

### Die Vorteile des Multi-Repos

**1. Klare Eigenverantwortung**
- Das Frontend-Team arbeitet nur in `frontend-repo`
- Das Backend-Team arbeitet nur in `backend-repo`
- Kein Merge-Konflikt-Chaos zwischen Teams

**2. Unabhängige Deployments**
```bash
# Frontend kann deployed werden, ohne den Backend-Code zu berühren
cd frontend-repo && git push origin main  # → triggert Frontend-Deploy
```

**3. Kleinere, übersichtlichere Repos**
Jedes Repository bleibt fokussiert. Kein Entwickler muss verstehen, wie alle Teile des Systems funktionieren.

**4. Unterschiedliche Technologien**
```
frontend-repo/  → TypeScript, Next.js
backend-repo/   → Go (völlig andere Sprache!)
ml-repo/        → Python, PyTorch
```

---

## Die Nachteile im Vergleich

| Problem | Monorepo | Multi-Repo |
|---|---|---|
| Langsame CI/CD | Ja (alles muss gebaut werden) | Nein |
| Shared-Code-Updates | Einfach | Aufwendig (Versioning) |
| Große Git-History | Ja | Nein |
| Setup-Komplexität | Hoch (Tooling nötig) | Niedrig |
| Cross-Repo-Bugs | Schwer zu finden | Sehr schwer zu finden |
| Onboarding neuer Entwickler | Komplex | Einfach pro Repo |

---

## Monorepo-Tools: Was du brauchst

Ohne die richtigen Tools wird ein Monorepo schnell schmerzhaft:

### Turborepo (empfohlen für JS/TS)

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],  // Erst dependencies bauen
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

Turborepo baut nur das, was sich geändert hat — und cacht Ergebnisse intelligent.

### Nx

Nx ist mächtiger, aber komplexer. Ideal für Enterprise-Projekte mit vielen Teams.

### pnpm Workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

pnpm Workspaces sind die Grundlage — Turborepo oder Nx bauen darauf auf.

---

## Wann was wählen?

### Starte mit einem Monorepo, wenn...

- Du **alleine** arbeitest oder ein **kleines Team** (< 5 Entwickler) hast
- Du **TypeScript** im gesamten Stack verwendest
- Du viel **gemeinsamen Code** hast (Types, Utils, UI-Komponenten)
- Du ein **Full-Stack-Framework** wie Next.js verwendest

### Wähle Multi-Repo, wenn...

- Du **verschiedene Teams** hast, die unabhängig deployent wollen
- Du **verschiedene Technologien** mischst (JS Frontend, Go Backend)
- Die Repos **wirklich unabhängig** sind und kaum Code teilen
- Du **Sicherheitsanforderungen** hast (Entwickler sollen nicht den gesamten Code sehen)

> [!NOTE]
> Viele erfolgreiche Teams starten mit einem Monorepo und teilen es später auf. Das Gegenteil — von Multi-Repo zu Monorepo wechseln — ist wesentlich aufwendiger.

---

## Beispiel-Setup: Monorepo mit Next.js und tRPC

```
mein-saas/
├── apps/
│   └── web/               ← Next.js (Frontend + API via tRPC)
├── packages/
│   ├── db/                ← Datenbankschema (Prisma/Supabase)
│   └── types/             ← Shared TypeScript Types
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

Das ist ein solides Setup für die meisten SaaS-Projekte — einfach zu starten, skaliert gut.

> [!IMPORTANT]
> Wenn du Turborepo verwendest: Konfiguriere Cache-Outputs korrekt, sonst profitierst du nicht vom Caching und CI/CD wird langsam.

---

## Wie Venator dir hilft

Venator fragt dich nach deinem Team, deinem Stack und deinen geplanten Projekten — und empfiehlt dann, ob ein Monorepo oder Multi-Repo besser passt. Bei Monorepo-Empfehlungen zeigt Venator konkret, welche Tools (Turborepo, pnpm Workspaces) du brauchst und wie die Ordnerstruktur aussehen könnte.

## Weiterführende Artikel

- [GitOps: Infrastruktur mit Git verwalten](/learn/gitops)
- [CI/CD Pipelines erklärt](/learn/cicd-pipelines)
- [TypeScript Tips für Einsteiger](/learn/typescript-tips)
