---
title: "Caching & Performance"
description: "Warum langsame Apps Nutzer verlieren – und wie CDN, Browser-Cache und Server-Cache helfen."
category: "Performance"
order: 8
keywords: "Caching, CDN, Performance, Redis, Browser Cache, Server Cache, Web Vitals, Ladezeiten"
---

## Warum Performance zählt

Google hat gemessen: Wenn eine Seite **1 Sekunde** länger zum Laden braucht, verliert sie **7% Conversions**. Das heißt: Wenn 100 Leute auf deiner Seite kaufen würden, kaufen bei einer trägen App nur noch 93.

Außerdem straft Google langsame Seiten in den Suchergebnissen ab. Performance ist also gleichzeitig User Experience und SEO.

---

## Was verlangsamt Apps?

```
Anfrage des Browsers
       ↓
DNS-Lookup (Wo ist diese Domain?)        ~20ms
       ↓
TCP-Verbindung aufbauen                  ~50ms
       ↓
Server verarbeitet die Anfrage           ~100-2000ms ← hier steckt das Problem
  - Datenbankabfragen
  - Externe API-Calls
  - Komplexe Berechnungen
       ↓
Daten werden übertragen                  ~50-500ms
       ↓
Browser rendert die Seite                ~50-200ms
```

Das größte Problem ist fast immer die **Server-Verarbeitungszeit**. Und hier kommt Caching ins Spiel.

---

## Was ist Caching?

**Caching** bedeutet: Ergebnis einmal berechnen, für eine Weile speichern, bei wiederholter Anfrage direkt zurückgeben.

```
Ohne Cache:
  Anfrage → Datenbank → Berechnung → Antwort   (300ms)
  Anfrage → Datenbank → Berechnung → Antwort   (300ms)
  Anfrage → Datenbank → Berechnung → Antwort   (300ms)

Mit Cache:
  Anfrage → Datenbank → Berechnung → Cache speichern → Antwort   (300ms)
  Anfrage → Cache lesen → Antwort                                 (5ms)
  Anfrage → Cache lesen → Antwort                                 (5ms)
```

---

## Die drei Ebenen des Cachings

### 1. Browser-Cache

Der Browser speichert Dateien (Bilder, CSS, JS) lokal. Beim zweiten Besuch muss nichts mehr heruntergeladen werden.

```
# HTTP Header vom Server:
Cache-Control: max-age=31536000, immutable
# Bedeutet: Diese Datei 1 Jahr speichern und nicht nochmal anfragen
```

Next.js und Vercel setzen diese Header automatisch für alle statischen Assets.

---

### 2. CDN – Content Delivery Network

Ein **CDN** ist ein globales Netzwerk von Servern. Deine Bilder und Seiten werden auf Servern in Frankfurt, New York, Tokyo und überall sonst gespeichert. Ein Nutzer aus Japan bekommt die Daten von einem Server in Tokyo – nicht von deinem Hauptserver in den USA.

```
Ohne CDN:
  Nutzer in Tokyo → Server in Frankfurt → 200ms

Mit CDN:
  Nutzer in Tokyo → CDN-Server in Tokyo → 10ms
```

Vercel hat ein eingebautes CDN. Wenn du auf Vercel hostest, hast du automatisch globale CDN-Optimierungen ohne Konfiguration.

> [!TIP]
> Cloudflare ist eine beliebte Alternative: Gratis-Plan, extrem schnell, schützt auch vor DDoS-Angriffen.

---

### 3. Server-seitiger Cache

Für Daten, die sich selten ändern (z.B. Blogposts, Produktlisten), kann der Server das Ergebnis zwischenspeichern.

**In Next.js** ist das direkt eingebaut:

```ts
// fetch() mit Cache-Konfiguration
const posts = await fetch("https://api.example.com/posts", {
  next: { revalidate: 3600 }, // Alle 60 Minuten neu laden
});
```

**Redis** ist der Standard für komplexeres Server-Caching:

```ts
import { Redis } from "@upstash/redis";
const redis = new Redis({ /* config */ });

// Cache lesen oder berechnen
const cached = await redis.get("user:42:profile");
if (cached) return cached;

const profile = await db.getUser(42); // Teurer DB-Lookup
await redis.set("user:42:profile", profile, { ex: 3600 }); // 1h cachen
return profile;
```

---

## Web Vitals – Was Google misst

Google bewertet Seiten anhand von **Core Web Vitals**:

| Metrik | Beschreibung | Gut | Schlecht |
|---|---|---|---|
| **LCP** | Largest Contentful Paint – wann ist das größte Element sichtbar? | < 2.5s | > 4s |
| **FID/INP** | Wie schnell reagiert die Seite auf Klicks? | < 100ms | > 300ms |
| **CLS** | Cumulative Layout Shift – springt die Seite beim Laden? | < 0.1 | > 0.25 |

Teste deine Seite kostenlos mit [PageSpeed Insights](https://pagespeed.web.dev/).

---

## Quick Wins: Was du sofort tun kannst

```
✅ Bilder optimieren
   - next/image nutzen statt <img> (automatische WebP-Konvertierung)
   - Bilder komprimieren (squoosh.app)

✅ Fonts optimieren
   - next/font nutzen (lädt Fonts lokal, kein externer Request)
   - Nur die Gewichte laden, die du nutzt

✅ JavaScript reduzieren
   - 'use client' sparsam einsetzen (Server Components bevorzugen)
   - Große Libraries lazy-loaden

✅ Datenbank optimieren
   - Indexes für häufig gefilterte Spalten erstellen
   - N+1-Queries vermeiden
```

> [!IMPORTANT]
> **Premature Optimization ist der Feind.** Optimiere nichts, bevor du ein messbares Problem hast. Starte mit einem funktionierenden Produkt. Wenn Nutzer klagen, messe erst, dann optimiere gezielt.
