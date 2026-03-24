---
title: "CI/CD Pipelines"
description: "Was sind Continuous Integration und Continuous Deployment – und warum du sie von Beginn an einrichten solltest."
category: "DevOps"
order: 10
keywords: "CI/CD, GitHub Actions, Continuous Integration, Deployment Pipeline, DevOps, Automatisierung, Tests"
---

## Das Problem ohne CI/CD

Ohne automatisierte Pipelines sieht ein typischer Deploy-Prozess so aus:

```
1. Entwickler schreibt Code
2. Entwickler denkt: "Das sollte funktionieren"
3. git push auf main
4. Produktionsserver pullt den Code
5. App startet neu
6. Nutzer beschweren sich: Seite kaputt
7. Entwickler hetzt zum Laptop
8. 40 Minuten Debugging
```

**CI/CD** (Continuous Integration / Continuous Deployment) automatisiert und sichert diesen Prozess ab.

---

## Was bedeuten CI und CD?

### Continuous Integration (CI)
Bei jedem `git push` wird automatisch ein Prozess gestartet, der:
- Code baut (`npm run build`)
- Tests ausführt (`npm run test`)
- Type-Checking macht (`npx tsc`)
- Linting prüft (`npm run lint`)

Wenn einer dieser Schritte fehlschlägt, wird der Entwickler sofort benachrichtigt – **bevor** der Code in Produktion geht.

### Continuous Deployment (CD)
Wenn CI erfolgreich war, wird der Code **automatisch** in die Produktionsumgebung deployed.

```
git push
    ↓
Tests laufen (2-5 min)
    ↓
Wenn OK → automatisch deployed ✅
Wenn Fehler → PR blockiert ❌, Entwickler bekommt Email
```

---

## GitHub Actions – CI/CD für alle

GitHub Actions ist kostenlos für öffentliche Repositories und hat großzügige kostenlose Limits für private Repos. Es ist der einfachste Einstieg in CI/CD.

Eine Pipeline ist eine `.yml`-Datei in deinem Repo:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest

    steps:
      - name: Code auschecken
        uses: actions/checkout@v4

      - name: Node.js einrichten
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Abhängigkeiten installieren
        run: npm ci

      - name: TypeScript prüfen
        run: npx tsc --noEmit

      - name: Linting prüfen
        run: npm run lint

      - name: Build testen
        run: npm run build
```

Diese Datei einfach im richtigen Ordner speichern – GitHub erkennt sie automatisch.

> [!TIP]
> Beginne mit einer einfachen Pipeline (nur `build` + `lint`). Du kannst sie jederzeit um Tests und weitere Schritte erweitern.

---

## Umgebungsvariablen in CI/CD

Deine API-Keys dürfen nie in den Code committet werden. In GitHub Actions nutzt du **Secrets**:

```yaml
# In .github/workflows/ci.yml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
```

Secrets werden in GitHub unter `Settings → Secrets and variables → Actions` gesetzt.

> [!IMPORTANT]
> **Niemals `.env`-Dateien committen!** Stelle sicher, dass `.env.local` in deiner `.gitignore` steht. Wenn du versehentlich einen API-Key committed hast, revoke ihn sofort und erstelle einen neuen.

---

## Vercel: CD ist bereits eingebaut

Wenn du auf Vercel hostest, hast du CD out-of-the-box:

```
git push main → Vercel baut automatisch → Deployment live
git push feature-branch → Vercel erstellt Preview-URL
```

Du brauchst für Vercel also nur noch CI (den Test/Lint-Schritt), kein eigenes Deployment-Skript.

---

## Branch-Strategie: So schützt du main

```
main (Produktion)
 └── develop (Integration)
      ├── feature/user-auth
      ├── feature/payment-flow
      └── bugfix/login-redirect
```

**Die Regel:** Direktes Pushen auf `main` ist verboten. Alle Änderungen kommen über Pull Requests. Die CI-Pipeline muss grün sein, bevor ein PR gemergt werden darf.

In GitHub unter `Settings → Branches → Branch protection rules`:
- ✅ Require status checks to pass before merging
- ✅ Require pull request reviews before merging (für Teams)

---

## Die minimale Pipeline für neue Projekte

```yaml
# .github/workflows/ci.yml – Minimale, aber sinnvolle Pipeline
name: CI

on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm run build
        env:
          # Dummy-Werte für den Build-Schritt
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder
```

Kopiere das in dein Repo und du hast sofort einen funktionierenden CI-Prozess.
