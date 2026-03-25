---
title: "Rate Limiting implementieren"
description: "Rate Limiting für Web-APIs implementieren: Fixed Window, Sliding Window und Token Bucket erklärt — mit konkreten Code-Beispielen für Next.js und Redis."
category: "Authentifizierung & Sicherheit"
order: 34
keywords: ["Rate Limiting", "API-Schutz", "DDoS-Schutz", "Redis", "Next.js Middleware"]
---

## Warum du Rate Limiting brauchst

Ohne Rate Limiting kann jeder:
- Deine API mit Millionen von Anfragen überfluten (DoS-Angriff)
- Passwörter durch Brute-Force-Angriffe erraten
- Deine KI-API-Kosten in die Höhe treiben
- Scraper deine Daten massenweise extrahieren

**Rate Limiting** begrenzt, wie viele Anfragen ein Nutzer/IP in einem Zeitraum machen darf.

---

## Algorithmus 1: Fixed Window Counter

Einfachster Ansatz: Zähle Anfragen in einem fixen Zeitfenster.

```
Zeitfenster: 60 Sekunden
Limit: 100 Anfragen

00:00 - 01:00 → Anfragen: 1, 2, 3, ..., 100 → danach: 429 Too Many Requests
01:00 - 02:00 → Counter reset → wieder 100 erlaubt
```

**Problem**: Jemand kann am Ende von Fenster 1 + Anfang von Fenster 2 = 200 Anfragen in 2 Sekunden machen.

```typescript
// Fixed Window mit Redis
async function fixedWindowLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `ratelimit:${identifier}:${window}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}
```

---

## Algorithmus 2: Sliding Window Log

Genauer: Speichere Timestamps jeder Anfrage.

```typescript
async function slidingWindowLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const key = `ratelimit:sliding:${identifier}`;

  // Zu alte Einträge entfernen
  await redis.zRemRangeByScore(key, '-inf', now - windowMs);

  // Aktuelle Anfragenanzahl im Fenster
  const count = await redis.zCard(key);

  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Diese Anfrage hinzufügen
  await redis.zAdd(key, [{ score: now, value: `${now}-${Math.random()}` }]);
  await redis.expire(key, windowSeconds);

  return { allowed: true, remaining: limit - count - 1 };
}
```

---

## Algorithmus 3: Token Bucket

Ermöglicht kurze Bursts, begrenzt langfristigen Durchsatz:

```
Eimer hat 10 Tokens
Tokens werden mit 1/Sekunde aufgefüllt (max 10)
Jede Anfrage kostet 1 Token

→ 10 sofortige Anfragen erlaubt (Burst)
→ Danach: 1 Anfrage/Sekunde (Rate)
```

```typescript
async function tokenBucketLimit(
  identifier: string,
  capacity: number,      // Max Tokens
  refillRate: number,    // Tokens pro Sekunde
): Promise<{ allowed: boolean; tokens: number }> {
  const key = `tokenbucket:${identifier}`;
  const now = Date.now() / 1000;

  const data = await redis.hGetAll(key);
  const lastRefill = parseFloat(data.lastRefill ?? now.toString());
  const currentTokens = parseFloat(data.tokens ?? capacity.toString());

  // Tokens auffüllen seit letztem Refill
  const elapsed = now - lastRefill;
  const newTokens = Math.min(capacity, currentTokens + elapsed * refillRate);

  if (newTokens < 1) {
    await redis.hSet(key, { tokens: newTokens, lastRefill: now });
    return { allowed: false, tokens: 0 };
  }

  await redis.hSet(key, { tokens: newTokens - 1, lastRefill: now });
  await redis.expire(key, Math.ceil(capacity / refillRate) + 60);

  return { allowed: true, tokens: Math.floor(newTokens - 1) };
}
```

---

## Rate Limiting in Next.js Middleware

Der beste Ort für Rate Limiting: **Middleware** — läuft vor allen Requests.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Identifier: IP-Adresse oder (besser) User-ID
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
    ?? request.headers.get('x-real-ip')
    ?? '127.0.0.1';

  const identifier = ip;

  // Verschiedene Limits für verschiedene Endpunkte
  const isAiEndpoint = request.nextUrl.pathname.startsWith('/api/ai');
  const limit = isAiEndpoint ? 10 : 100;  // KI-Endpunkte strenger begrenzen
  const window = isAiEndpoint ? 60 : 60;

  const { allowed, remaining } = await fixedWindowLimit(identifier, limit, window);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte warte kurz und versuche es erneut.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## Upstash Ratelimit — einfacher Weg für Serverless

```typescript
// Mit Upstash (managed Redis, serverless-freundlich)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),  // 10 Anfragen in 10 Sekunden
  analytics: true,  // Tracking im Upstash Dashboard
});

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'X-RateLimit-Reset': reset.toString() } }
    );
  }

  return NextResponse.next();
}
```

---

## Was bei Überschreitung senden?

```typescript
// Hilfreiche 429-Antwort
return Response.json({
  error: 'Zu viele Anfragen',
  message: 'Du hast das Anfragen-Limit erreicht. Bitte warte kurz.',
  retryAfter: 60,  // Sekunden bis zum nächsten Versuch
}, {
  status: 429,
  headers: {
    'Retry-After': '60',          // Standard-Header
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
  },
});
```

> [!NOTE]
> Das Venator-Projekt hat bereits Rate Limiting in `app/api/rate-limit.ts` implementiert — 10 API-Aufrufe pro Minute pro Nutzer/IP. Du kannst diesen Code als Referenz nutzen.

---

## Verschiedene Limits für verschiedene Aktionen

```typescript
const limits = {
  login:     { requests: 5,   window: 300 },  // 5 Login-Versuche in 5 Min
  register:  { requests: 3,   window: 3600 }, // 3 Registrierungen pro Stunde
  api:       { requests: 100, window: 60 },   // 100 API-Calls pro Minute
  ai:        { requests: 10,  window: 60 },   // 10 KI-Anfragen pro Minute
  search:    { requests: 30,  window: 60 },   // 30 Suchen pro Minute
};
```

---

## Wie Venator dir hilft

Venator empfiehlt Rate Limiting als Standard-Sicherheitsmaßnahme für alle API-Endpunkte. Du bekommst konkrete Konfigurationsempfehlungen — Limits und Zeitfenster — basierend auf deinem Projekttyp und deinem erwarteten Traffic.

## Weiterführende Artikel

- [Redis: Wann und wie einsetzen?](/learn/redis-use-cases)
- [API-Keys sicher verwalten](/learn/api-keys-verwalten)
- [Sicherheitsgrundlagen für Web-Apps](/learn/security-basics)
