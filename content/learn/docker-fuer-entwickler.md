---
title: "Docker für Entwickler: Ein praktischer Einstieg"
description: "Docker praktisch erklärt: Was Container sind, wie Dockerfiles funktionieren, docker-compose für lokale Entwicklung und wann Docker wirklich Sinn ergibt."
category: "Deployment & Hosting"
order: 37
keywords: ["Docker", "Container", "Dockerfile", "docker-compose", "Deployment"]
---

## Was ist Docker und wozu brauchst du es?

Du kennst das Problem: "Bei mir läuft es" — aber auf dem Server deines Kollegen oder in der Produktion nicht. Unterschiedliche Node.js-Versionen, fehlende Systemabhängigkeiten, verschiedene Betriebssysteme.

**Docker** löst dieses Problem mit **Containern**: Eine abgeschlossene Umgebung, die alles enthält, was deine App zum Laufen braucht — das Betriebssystem, die Runtime, alle Abhängigkeiten. Ein Container läuft überall identisch.

---

## Container vs. Virtuelle Maschine

```
Virtuelle Maschine:
┌──────────────────────────────┐
│  App      │  App             │
│  OS (Linux│  OS (Windows)    │
│  Hypervisor (VMware/VirtualBox)│
│  Host-Betriebssystem         │
└──────────────────────────────┘

Docker Container:
┌──────────────────────────────┐
│  App      │  App             │
│  Container│  Container       │
│  Docker Engine (leichtgewichtig)│
│  Host-Betriebssystem         │
└──────────────────────────────┘
```

Container teilen den Kernel des Host-Betriebssystems — sie starten in Sekunden und verbrauchen viel weniger RAM als VMs.

---

## Das erste Dockerfile

```dockerfile
# Basis-Image: Node.js 20 (Alpine = kleines Linux)
FROM node:20-alpine

# Arbeitsverzeichnis im Container
WORKDIR /app

# Abhängigkeiten zuerst kopieren (besseres Layer-Caching)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Source-Code kopieren
COPY . .

# Build (für Next.js)
RUN npm run build

# Port freigeben
EXPOSE 3000

# Startbefehl
CMD ["npm", "start"]
```

### Das Image bauen und starten

```bash
# Image bauen
docker build -t meine-app:v1 .

# Container starten
docker run -p 3000:3000 meine-app:v1

# Mit Environment Variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  meine-app:v1
```

---

## Multi-Stage Builds — kleine Images

```dockerfile
# Stage 1: Builder (hat alle Dev-Dependencies)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runner (nur das Nötigste)
FROM node:20-alpine AS runner
WORKDIR /app

# Nur Production-Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Nur den Build aus Stage 1 kopieren
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

Das fertige Image ist deutlich kleiner, weil TypeScript, ESLint und andere Dev-Tools nicht enthalten sind.

---

## docker-compose — mehrere Services zusammen

In der Entwicklung brauchst du oft mehrere Services: App + Datenbank + Redis + ...

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Deine Next.js App
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/mydb
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - .:/app          # Hot-Reload in Entwicklung
      - /app/node_modules  # node_modules nicht überschreiben

  # PostgreSQL Datenbank
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Daten bleiben erhalten

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

```bash
# Alle Services starten
docker-compose up

# Im Hintergrund starten
docker-compose up -d

# Logs ansehen
docker-compose logs -f app

# Stoppen und Volumes löschen
docker-compose down -v
```

---

## .dockerignore — was nicht ins Image soll

```
# .dockerignore
node_modules
.next
.env*
.git
*.md
```

Ähnlich wie `.gitignore`, aber für Docker. Ohne es würde `COPY . .` deine gesamten `node_modules` (Gigabytes!) ins Image kopieren.

---

## Wann Docker wählen?

### Ja, wenn...

- Du auf einem **eigenen Server** (VPS, Hetzner, Digital Ocean) hostst
- Du **mehrere Services** lokal entwickelst (App + DB + Redis)
- Dein Team hat unterschiedliche Betriebssysteme (Mac, Windows, Linux)
- Du zu **Kubernetes** migrieren möchtest

### Nein, wenn...

- Du auf **Vercel, Railway oder Render** hostest — die übernehmen das Containerisieren
- Du ein einfaches **Next.js-Projekt** auf Vercel hast — kein Docker nötig
- Du gerade ein **MVP baust** — docker-compose für die DB reicht

> [!NOTE]
> Für **lokale Entwicklung** ist docker-compose für die Datenbank extrem nützlich — du brauchst keine lokale PostgreSQL-Installation. Für das Hosting musst du Docker aber nicht unbedingt selbst verwalten.

---

## Praktischer Quick-Start: Nur für lokale DB

```yaml
# docker-compose.dev.yml — nur für lokale Entwicklung
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: myapp_dev
    volumes:
      - postgres_dev:/var/lib/postgresql/data

volumes:
  postgres_dev:
```

```bash
docker-compose -f docker-compose.dev.yml up -d
# → Lokale PostgreSQL auf Port 5432 läuft
# → DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/myapp_dev
```

---

## Wie Venator dir hilft

Wenn du dein Hosting-Ziel beschreibst, empfiehlt Venator, ob du Docker brauchst. Für Vercel-Deployments: kein Docker nötig. Für eigene Server oder Hetzner VPS: Venator gibt dir ein passendes Dockerfile und docker-compose-Setup.

## Weiterführende Artikel

- [Vercel vs AWS: Was passt zu deinem Projekt?](/learn/vercel-vs-aws)
- [Kubernetes vs Serverless: Der Vergleich](/learn/kubernetes-vs-serverless)
- [CI/CD Pipelines erklärt](/learn/cicd-pipelines)
