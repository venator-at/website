---
title: "JWT vs Sessions: Was ist besser?"
description: "JWT oder Sessions? Verständlicher Vergleich beider Authentifizierungsmethoden mit Vor- und Nachteilen, Sicherheitshinweisen und einer klaren Empfehlung für dein Projekt."
category: "Authentifizierung & Sicherheit"
order: 31
keywords: ["JWT", "Session", "Authentifizierung", "JSON Web Token", "Cookie-basierte Auth"]
---

## Das Grundproblem: HTTP ist zustandslos

HTTP-Requests sind unabhängig voneinander. Dein Server erinnert sich nicht, dass du gerade eingeloggt bist — er vergisst es nach jedem Request.

Authentifizierung löst dieses Problem: Irgendwie muss dein Browser beim nächsten Request beweisen, dass du noch eingeloggt bist. Dafür gibt es zwei populäre Ansätze: **Sessions** und **JWTs**.

---

## Sessions — der klassische Ansatz

### Wie Sessions funktionieren

```
1. Nutzer meldet sich an (E-Mail + Passwort)
2. Server prüft Credentials → OK
3. Server erstellt Session in der Datenbank:
   { sessionId: "abc123", userId: "usr_1", createdAt: ... }
4. Server schickt Session-Cookie:
   Set-Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Strict
5. Browser speichert Cookie automatisch
6. Bei jedem Request: Cookie wird mitgeschickt
7. Server schlägt Session-ID in DB nach → kennt den Nutzer
```

```typescript
// Session-basierte Auth mit Express
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // Nur über HTTPS
    httpOnly: true,    // Kein JavaScript-Zugriff
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 Tage
    sameSite: 'strict',
  },
}));

// Login
app.post('/login', async (req, res) => {
  const user = await validateCredentials(req.body.email, req.body.password);
  req.session.userId = user.id;
  res.json({ success: true });
});

// Geschützte Route
app.get('/profile', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht angemeldet' });
  // ...
});
```

---

## JWT — JSON Web Tokens

### Wie JWTs funktionieren

```
1. Nutzer meldet sich an
2. Server erstellt JWT (wird NICHT in DB gespeichert):
   Header: { alg: "HS256", typ: "JWT" }
   Payload: { sub: "usr_1", email: "max@example.com", exp: 1710000000 }
   Signature: HMACSHA256(header + "." + payload, SECRET_KEY)
3. JWT wird an den Client zurückgegeben
4. Client speichert JWT (localStorage oder Cookie)
5. Bei jedem Request: JWT wird mitgeschickt
   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
6. Server prüft Signature — keine DB-Abfrage nötig!
```

```typescript
import jwt from 'jsonwebtoken';

// JWT erstellen
function createToken(userId: string): string {
  return jwt.sign(
    { sub: userId, iat: Date.now() },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

// JWT verifizieren
function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
}

// Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Kein Token' });

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Ungültiger Token' });
  }
}
```

---

## Der direkte Vergleich

| Kriterium | Sessions | JWT |
|---|---|---|
| Server-seitiger Zustand | Ja (DB/Redis nötig) | Nein (stateless) |
| Sofortiger Logout möglich | Ja (Session löschen) | Nein (Token läuft ab) |
| Horizontale Skalierung | Aufwendiger (geteilte Session-DB) | Einfach (kein Zustand) |
| Token-Widerruf | Sofort | Schwierig (bis Ablauf) |
| Payload-Größe | Klein (nur Session-ID im Cookie) | Größer (Daten im Token) |
| Sicherheit bei Diebstahl | Session kann sofort ungültig gemacht werden | Gültig bis Ablauf |

---

## Das JWT-Problem: Widerruf

Das größte JWT-Problem: Du **kannst einen Token nicht ungültig machen**, bevor er abläuft.

```
Szenario:
- Nutzer loggt sich aus
- Token gilt noch 59 Minuten
- Wenn jemand den Token hat, kann er noch 59 Minuten darauf zugreifen!
```

Lösungen:
1. **Kurze Ablaufzeit** (15-60 Minuten) + Refresh Tokens
2. **Token Blocklist** in Redis (macht JWTs statefull — defeats the purpose)
3. **Doch Sessions verwenden**

> [!IMPORTANT]
> **Speichere JWTs NIE in localStorage!** JavaScript kann auf localStorage zugreifen — XSS-Angriffe können den Token stehlen. Speichere JWTs in `httpOnly`-Cookies, dann kann JavaScript nicht darauf zugreifen.

---

## Wo JWT wirklich glänzt

### Microservices und API-zu-API-Kommunikation

```typescript
// Service A gibt JWT an Service B weiter
// Service B kann Token lokal verifizieren — ohne Service A anzufragen!
const payload = jwt.verify(token, process.env.SHARED_PUBLIC_KEY!);
// Keine Netzwerkanfrage nötig → sehr schnell
```

### API-Tokens für Entwickler (wie GitHub Personal Access Tokens)

Langlebige Tokens für nicht-interaktive Nutzung (Skripte, CI/CD).

---

## Empfehlung

### Für Web-Apps: Sessions (oder von Auth-Library verwalten lassen)

Sessions sind simpler, sicherer und ermöglichen sofortigen Logout. Der Overhead einer Session-DB (Redis) ist gering.

### Für SPAs / Mobile Apps mit REST-API: JWT mit kurzer Lebensdauer

Wenn du kein serverseitiges Rendering hast, sind JWTs praktischer — aber immer in httpOnly-Cookies speichern, nicht in localStorage.

### Für beides: Auth-Library nutzen

```typescript
// NextAuth.js — verwaltet Sessions und JWTs automatisch korrekt
import NextAuth from 'next-auth';

export const { handlers, auth } = NextAuth({
  providers: [Google, GitHub],
  session: { strategy: 'jwt' },  // oder 'database'
});
```

> [!NOTE]
> **Supabase Auth** verwendet JWTs intern, aber du musst dich nicht darum kümmern. Der Supabase Client verwaltet Token-Speicherung, Refresh und Validierung automatisch.

---

## Wie Venator dir hilft

Wenn du Auth-Anforderungen beschreibst, empfiehlt Venator die passende Strategie. Für Next.js-Apps erscheint Supabase Auth oder NextAuth als erste Empfehlung — beide lösen die Session/JWT-Komplexität automatisch und sicher.

## Weiterführende Artikel

- [OAuth2 Flow Schritt für Schritt erklärt](/learn/oauth2-flow)
- [CSRF und XSS: Angriffe verstehen und abwehren](/learn/csrf-xss-schutz)
- [API-Keys sicher verwalten](/learn/api-keys-verwalten)
