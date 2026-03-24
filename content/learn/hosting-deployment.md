---
title: "Hosting & Deployment"
description: "Vercel, Railway, Fly.io oder AWS? Wo du deine App deployst und warum es wichtig ist."
category: "Deployment & Hosting"
order: 6
keywords: "Vercel, Railway, Fly.io, AWS, Netlify, Hosting, Deployment, Cloud, DevOps, Server"
---

## Warum Hosting wichtig ist (und oft unterschätzt wird)

Den Code schreiben ist eine Sache. Ihn der Welt zugänglich machen, ist eine andere. **Hosting** bedeutet: Irgendwo läuft dein Code auf einem Server, der rund um die Uhr erreichbar ist – und das zuverlässig, schnell und sicher.

Als Anfänger unterschätzt man oft, wie viel Zeit schlechte Hosting-Entscheidungen kosten können. Hier ist eine ehrliche Übersicht der beliebtesten Optionen.

---

## Vercel – Der Goldstandard für Frontend

**Kostet:** Gratis für Hobby-Projekte, ab ~20$/Monat für Teams
**Ideal für:** Next.js, alle statischen Sites, Frontend-Projekte
**Schwierigkeit:** ⭐ (sehr einfach)

Vercel wurde von den Erfindern von Next.js gebaut. Die Integration ist deshalb perfekt:

1. Verbinde dein GitHub-Repository
2. Klicke auf „Deploy"
3. Fertig – deine App läuft auf einer globalen CDN-Infrastruktur

Jeder `git push` auf deinen `main`-Branch löst automatisch ein neues Deployment aus. Du kriegst sogar **Preview-URLs** für jeden Pull Request.

```bash
# In 3 Schritten live:
npm install -g vercel
vercel login
vercel --prod
```

> [!TIP]
> Für Next.js-Projekte ist Vercel immer die erste Wahl. Der kostenlose Plan reicht für fast alle Side-Projects und MVPs.

---

## Railway – Fullstack ohne Kopfschmerzen

**Kostet:** Gratis mit Limits, danach Pay-as-you-go (~5$ Minimum/Monat)
**Ideal für:** Fullstack-Apps, Backend-Dienste, Datenbanken
**Schwierigkeit:** ⭐⭐

Railway ist wie Vercel, aber für Backends und Datenbanken. Du kannst dort:

- Einen Node.js-Server hosten
- Eine PostgreSQL-Datenbank mit einem Klick deployen
- Redis, MySQL oder eigene Docker-Container starten

Die Stärke von Railway: Alles läuft in einem Dashboard. Du kannst deinen Backend-Server und deine Datenbank nebeneinander sehen, mit Umgebungsvariablen und Logs pro Service.

```yaml
# railway.toml – Minimale Konfiguration
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
```

---

## Fly.io – Wenn du globale Performance brauchst

**Kostet:** Gratis-Tier, danach Pay-as-you-go (Compute + Storage)
**Ideal für:** Latenz-sensitive Apps, globale Nutzer, Docker-Container
**Schwierigkeit:** ⭐⭐⭐

Fly.io deployiert deinen Container auf Servern in über 30 Regionen weltweit und leitet Anfragen automatisch zum nächstgelegenen Server weiter. Das Ergebnis: Sehr niedrige Latenz für internationale Nutzer.

Der Nachteil: Du musst mit Docker umgehen können und die CLI verstehen.

```bash
# Fly.io Deployment
fly auth login
fly launch        # Erstellt eine fly.toml
fly deploy        # Deployiert deinen Container
```

---

## AWS / Google Cloud / Azure – Die Profis

**Kostet:** Pay-as-you-go, sehr günstig bei richtiger Nutzung, sehr teuer bei Fehlern
**Ideal für:** Enterprise-Projekte, stark regulierte Branchen, maßgeschneiderte Infrastruktur
**Schwierigkeit:** ⭐⭐⭐⭐⭐

AWS, GCP und Azure sind die "echten" Cloud-Plattformen. Sie geben dir maximale Kontrolle, aber fordern auch maximales Wissen.

Als Anfänger oder Junior-Entwickler solltest du diese erstmal meiden. Der Verwaltungsaufwand ist enorm, und ein falsches Konfigurations-Setting kann unerwartet hohe Rechnungen verursachen.

> [!IMPORTANT]
> **Antipattern:** Viele Anfänger denken, sie müssen von Beginn an AWS nutzen, "weil es professionell ist". Das ist falsch. Zalando, Notion und viele große Firmen haben mit Heroku oder Railway angefangen. Wähle das Tool, das dich am schnellsten produktiv macht.

---

## Der direkte Vergleich

| Platform | Frontend | Backend | Datenbank | Einstieg | Preis |
|---|---|---|---|---|---|
| **Vercel** | ⭐⭐⭐⭐⭐ | ⚠️ Nur Serverless | ❌ | Sehr einfach | Gratis |
| **Railway** | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Einfach | ~5$/Mo |
| **Fly.io** | ✅ | ⭐⭐⭐⭐⭐ | ✅ | Mittel | Pay-as-you-go |
| **Netlify** | ⭐⭐⭐⭐ | ⚠️ Nur Serverless | ❌ | Sehr einfach | Gratis |
| **AWS** | ✅ | ✅ | ✅ | Sehr schwer | Pay-as-you-go |

---

## Die empfohlene Kombination für Anfänger

```
Frontend (Next.js)  →  Vercel
Datenbank           →  Supabase (managed PostgreSQL)
Backend-Services    →  Railway (wenn gebraucht)
```

Diese Kombination gibt dir alles, was du für ein vollständiges Produkt brauchst, ohne DevOps-Wissen vorauszusetzen. Alle drei haben großzügige kostenlose Pläne.

> [!TIP]
> **Checkliste vor dem Launch:**
> - [ ] Alle `NEXT_PUBLIC_*` Umgebungsvariablen in Vercel gesetzt?
> - [ ] Datenbank-URL in der Produktionsumgebung konfiguriert?
> - [ ] Custom Domain verbunden (auch im Gratis-Plan möglich)?
> - [ ] Automatische Deploys bei `git push` aktiviert?
