---
title: "Redis: Wann und wie einsetzen?"
description: "Redis richtig einsetzen: Caching, Session-Speicherung, Rate Limiting, Queues und mehr — mit konkreten Code-Beispielen und Tipps, wann Redis wirklich Sinn ergibt."
category: "Datenbanken"
order: 23
keywords: ["Redis", "Caching", "In-Memory-Datenbank", "Session Store", "Rate Limiting"]
---

## Was ist Redis und warum ist es so beliebt?

**Redis** (Remote Dictionary Server) ist eine **In-Memory-Datenbank** — das bedeutet, alle Daten leben im Arbeitsspeicher (RAM), nicht auf der Festplatte. Das macht Redis extrem schnell: Antwortzeiten unter 1 Millisekunde sind normal.

Redis kann zwar auch auf die Festplatte persistieren, aber sein Hauptvorteil ist die Geschwindigkeit durch das In-Memory-Prinzip.

Redis wird nicht als primäre Datenbank genutzt — es ergänzt eine Hauptdatenbank (wie PostgreSQL) für spezifische Aufgaben, bei denen Geschwindigkeit entscheidend ist.

---

## Die wichtigsten Redis-Datenstrukturen

Redis ist kein einfacher Key-Value-Store — es unterstützt verschiedene Datentypen:

| Typ | Beschreibung | Anwendungsfall |
|---|---|---|
| **String** | Einfacher Wert | Caching, Counter |
| **Hash** | Objekt mit Feldern | Session-Daten, User-Profile |
| **List** | Geordnete Liste | Queues, Activity Feeds |
| **Set** | Einzigartige Elemente | Tags, Online-Nutzer |
| **Sorted Set** | Geordnete einzigartige Elemente | Leaderboards, Rankings |
| **Stream** | Append-only Log | Event Streaming |

---

## Use Case 1: Caching

Der häufigste Einsatz. Teure Datenbankabfragen werden in Redis gecacht:

```typescript
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });

async function getProductById(id: string) {
  const cacheKey = `product:${id}`;

  // 1. Im Cache nachschauen
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);  // Cache Hit — blitzschnell
  }

  // 2. Aus der Datenbank laden
  const product = await db.products.findUnique({ where: { id } });

  // 3. Im Cache speichern (TTL: 5 Minuten)
  await redis.setEx(cacheKey, 300, JSON.stringify(product));

  return product;
}
```

**Wann den Cache invalidieren?**

```typescript
async function updateProduct(id: string, data: UpdateProductInput) {
  await db.products.update({ where: { id }, data });

  // Cache löschen, damit nächste Anfrage frische Daten bekommt
  await redis.del(`product:${id}`);
}
```

> [!NOTE]
> **Cache-Invalidierung** ist eines der schwierigsten Probleme in der Informatik. Starte mit einfachem TTL-Caching (Daten laufen nach X Sekunden ab) und füge manuelle Invalidierung nur dort hinzu, wo du sie brauchst.

---

## Use Case 2: Session-Speicherung

HTTP ist zustandslos — Logins müssen irgendwo gespeichert werden. Redis ist perfekt dafür:

```typescript
// Session bei Login erstellen
async function loginUser(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const sessionKey = `session:${sessionId}`;

  await redis.hSet(sessionKey, {
    userId,
    loginAt: Date.now(),
    lastActive: Date.now(),
  });

  // Session läuft nach 7 Tagen ab
  await redis.expire(sessionKey, 7 * 24 * 60 * 60);

  return sessionId;
}

// Session validieren
async function getSession(sessionId: string) {
  const sessionKey = `session:${sessionId}`;
  const session = await redis.hGetAll(sessionKey);

  if (!session.userId) return null;

  // Letzte Aktivität aktualisieren
  await redis.hSet(sessionKey, { lastActive: Date.now() });
  await redis.expire(sessionKey, 7 * 24 * 60 * 60);  // Ablaufzeit verlängern

  return session;
}
```

---

## Use Case 3: Rate Limiting

Redis eignet sich hervorragend für Rate Limiting:

```typescript
async function checkRateLimit(userId: string, maxRequests = 100, windowSeconds = 60): Promise<boolean> {
  const key = `ratelimit:${userId}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;

  const current = await redis.incr(key);

  if (current === 1) {
    // Ersten Request setzen → TTL setzen
    await redis.expire(key, windowSeconds);
  }

  return current <= maxRequests;
}

// Verwendung in einem API-Handler
export async function POST(req: Request) {
  const userId = req.user.id;
  const allowed = await checkRateLimit(userId);

  if (!allowed) {
    return Response.json({ error: 'Rate limit überschritten' }, { status: 429 });
  }

  // Eigentliche Logik...
}
```

---

## Use Case 4: Job Queues

Zeitaufwendige Aufgaben (E-Mails senden, Bilder verarbeiten) sollten asynchron ausgeführt werden:

```typescript
import Bull from 'bull';

// Queue erstellen
const emailQueue = new Bull('emails', { redis: process.env.REDIS_URL });

// Job hinzufügen (z. B. nach User-Registrierung)
await emailQueue.add('welcome', {
  to: user.email,
  name: user.name,
});

// Worker definiert, der Jobs verarbeitet
emailQueue.process('welcome', async (job) => {
  await sendWelcomeEmail(job.data.to, job.data.name);
});
```

**Empfohlene Libraries für Job Queues mit Redis:**
- **Bull / BullMQ** — populär, gut dokumentiert
- **Upstash QStash** — serverless-freundlich

---

## Use Case 5: Leaderboards mit Sorted Sets

```typescript
// Punkte hinzufügen
await redis.zAdd('leaderboard', [{ score: 1500, value: 'user:123' }]);
await redis.zAdd('leaderboard', [{ score: 2300, value: 'user:456' }]);
await redis.zAdd('leaderboard', [{ score: 890, value: 'user:789' }]);

// Top 10 abrufen
const top10 = await redis.zRange('leaderboard', 0, 9, { REV: true });
// → ['user:456', 'user:123', 'user:789']

// Rang eines Nutzers
const rank = await redis.zRevRank('leaderboard', 'user:123');
// → 1 (0-basiert, also Platz 2)
```

---

## Redis vs. andere Caching-Optionen

| Option | Persistenz | Skalierung | Komplexität | Kosten |
|---|---|---|---|---|
| **Redis** | Optional | Horizontal | Mittel | Mittel |
| **In-Memory (Node.js)** | Nein | Nein (single instance) | Niedrig | Kostenlos |
| **Memcached** | Nein | Horizontal | Niedrig | Mittel |
| **CDN-Cache (Vercel)** | Irrelevant | Automatisch | Niedrig | Im Plan enthalten |

---

## Wann Redis einsetzen?

### Ja, wenn...
- Deine DB-Queries zu langsam sind und du Caching brauchst
- Du Rate Limiting implementieren musst
- Du Job Queues für asynchrone Tasks brauchst
- Du Sessions über mehrere Server-Instanzen teilen musst

### Nein, wenn...
- Du gerade ein MVP baust — simplere Lösungen reichen
- Deine App nur auf einer Instanz läuft (In-Memory-Cache reicht)
- Du kein Budget für zusätzliche Infrastruktur hast

> [!IMPORTANT]
> **Upstash** bietet einen serverless Redis-Service mit einem großzügigen Gratis-Tier — ideal für Projekte auf Vercel, die Redis brauchen, ohne einen eigenen Server zu betreiben.

---

## Wie Venator dir hilft

Wenn du Performance-Probleme oder Rate Limiting in deinem Projekt beschreibst, empfiehlt Venator Redis mit konkreten Anwendungsfällen für dein Projekt. Du bekommst Empfehlungen für Hosting-Optionen (Upstash, Railway, Fly.io) und eine Einschätzung, ob Redis für dein Projekt-Stadium wirklich nötig ist.

## Weiterführende Artikel

- [Caching und Performance](/learn/caching-performance)
- [Rate Limiting implementieren](/learn/rate-limiting)
- [Datenbankabfragen optimieren](/learn/datenbankabfragen-optimieren)
