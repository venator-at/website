---
title: "Authentifizierung verstehen"
description: "Sessions, JWTs, OAuth – wie Login wirklich funktioniert und warum du es nicht selbst bauen solltest."
category: "Authentifizierung & Sicherheit"
order: 7
keywords: "Authentifizierung, JWT, Sessions, OAuth, Login, Supabase Auth, Clerk, NextAuth, Sicherheit"
---

## Was passiert, wenn du dich einloggst?

Du gibst Nutzername und Passwort ein – aber was passiert dahinter? Das Verständnis dieses Ablaufs ist einer der wichtigsten Grundlagen für jeden Entwickler.

```
1. Nutzer gibt Email + Passwort ein
2. Browser schickt POST /login an den Server
3. Server prüft: Gibt es diesen Nutzer? Stimmt das Passwort?
4. Wenn ja: Server erstellt einen "Beweis" (Token oder Session)
5. Browser speichert diesen Beweis
6. Bei jeder weiteren Anfrage schickt der Browser den Beweis mit
7. Server prüft den Beweis und weiß: Das ist Nutzer 42
```

Es gibt zwei grundlegende Methoden, diesen "Beweis" umzusetzen.

---

## Methode 1: Sessions (der klassische Weg)

Bei **Session-basierter Auth** speichert der Server die Nutzer-Session in einer Datenbank. Der Browser bekommt nur eine zufällige **Session-ID** (als Cookie).

```
Server-Datenbank:
  sessionId: "abc123" → userId: 42, expires: 2025-12-31

Browser-Cookie:
  session_id=abc123
```

Bei jeder Anfrage schickt der Browser `abc123` mit. Der Server schaut nach: "Was steckt hinter `abc123`? → userId: 42. Okay, der Nutzer ist eingeloggt."

**Vorteile:** Sehr einfach zu invalidieren (einfach die Session löschen → Nutzer ist ausgeloggt)
**Nachteile:** Jede Anfrage braucht einen Datenbank-Lookup

---

## Methode 2: JWTs – JSON Web Tokens

Ein **JWT** ist ein selbst-beschreibendes Token. Der Server generiert es und schickt es zum Browser. Kein Datenbank-Lookup nötig.

Ein JWT sieht so aus:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJleHAiOjE3MzUwMDB9.abc
```

Das ist Base64-kodiertes JSON:
```json
{
  "userId": 42,
  "email": "max@beispiel.de",
  "exp": 1735000000
}
```

Der Server "signiert" das Token mit einem geheimen Schlüssel. Wenn jemand das Token manipuliert, erkennt der Server das sofort – die Signatur stimmt dann nicht mehr.

> [!IMPORTANT]
> **JWTs sind nicht verschlüsselt – nur signiert!** Jeder kann den Inhalt eines JWTs lesen (mit base64decode). Speichere niemals Passwörter, Kreditkartendaten oder andere Geheimnisse in einem JWT.

---

## Methode 3: OAuth / "Login mit Google"

Kennst du den Button "Login mit Google / GitHub / Apple"? Das ist **OAuth 2.0**.

Der Ablauf:
```
1. Nutzer klickt "Login mit Google"
2. Browser wird zu Google weitergeleitet
3. Nutzer gibt Google-Passwort ein (auf Googles Seite!)
4. Google schickt deinen Browser zurück mit einem Code
5. Dein Server tauscht den Code gegen Nutzer-Informationen
6. Du erstellst einen Account (wenn nicht vorhanden) und loggst ein
```

**Vorteile:**
- Du speicherst kein Passwort → kein Haftungsrisiko
- Nutzer müssen kein neues Passwort merken
- Google/Apple verifiziert die Email automatisch

---

## Warum du Auth nicht selbst bauen solltest

Das korrekte Implementieren von Authentifizierung ist **extrem komplex**:

- Passwörter korrekt hashen (bcrypt, argon2)
- Brute-Force-Schutz (Rate Limiting)
- Sichere Session-Invalidierung
- CSRF-Schutz
- Passwort-Reset-Flows
- Multi-Factor Authentication
- Security Patches up-to-date halten

Ein kleiner Fehler kann dazu führen, dass Passwörter gestohlen werden. Deswegen gibt es fertige Auth-Dienste:

| Dienst | Stärken | Kostenlos? |
|---|---|---|
| **Supabase Auth** | Teil des Supabase-Stacks, sehr gut integriert | Ja |
| **Clerk** | Beste Developer Experience, tolle UI | Bis 10.000 MAU |
| **Auth.js (NextAuth)** | Open Source, sehr flexibel | Immer |
| **Firebase Auth** | Google-Infrastruktur, sehr zuverlässig | Großzügiger Free Tier |

> [!TIP]
> Wenn du Supabase als Datenbank nutzt, ist **Supabase Auth** die natürlichste Wahl – alles ist bereits integriert. Wenn du Clerk nutzt, bekommst du schöne UI-Komponenten geschenkt (Login-Modal, Profil-Seite etc.).

---

## Passwörter: Nie im Klartext speichern

```ts
// ❌ NIE SO – Passwort wird im Klartext gespeichert
await db.users.create({ password: "geheimesPasswort123" });

// ✅ SO – Passwort wird gehasht
import bcrypt from "bcryptjs";
const hash = await bcrypt.hash("geheimesPasswort123", 10);
await db.users.create({ password: hash });
```

Ein **Hash** ist eine Einbahnstraße: Du kannst das Passwort in einen Hash verwandeln, aber nicht umgekehrt. Wenn deine Datenbank gehackt wird und alle Passwörter gehasht sind, können Angreifer die echten Passwörter nicht lesen.

Wenn du Auth-Dienste wie Supabase oder Clerk nutzt, übernehmen diese das gesamte Hashing automatisch für dich.

---

## Wie Venator deine Auth-Entscheidung trifft

Venator berücksichtigt bei der Auth-Empfehlung:
- Nutzt du bereits Supabase? → Supabase Auth
- Brauchst du fertige Login-UI-Komponenten? → Clerk
- Offene Source-Präferenz mit maximaler Kontrolle? → Auth.js
- Firebase-Ökosystem? → Firebase Auth
