---
title: "Passwort-Hashing richtig machen"
description: "Passwort-Hashing korrekt implementieren: Warum MD5 und SHA gefährlich sind, wie bcrypt, Argon2 und scrypt funktionieren und was du niemals tun solltest."
category: "Authentifizierung & Sicherheit"
order: 36
keywords: ["Passwort-Hashing", "bcrypt", "Argon2", "Passwortsicherheit", "Kryptographie"]
---

## Warum Passwörter gehasht werden müssen

Wenn du Passwörter als Klartext in der Datenbank speicherst und die Datenbank gehackt wird, sind alle Passwörter deiner Nutzer sofort kompromittiert. Schlimmer: Da viele Menschen dasselbe Passwort auf mehreren Seiten nutzen, sind auch deren Konten bei Gmail, Banking und anderen Diensten gefährdet.

**Hashing** ist eine Einwegfunktion: Du kannst ein Passwort hashen, aber den Hash nicht zurückrechnen. Beim Login hashst du das eingegebene Passwort und vergleichst es mit dem gespeicherten Hash.

---

## Was du NICHT tun solltest

### MD5 und SHA — für Passwörter völlig ungeeignet

```typescript
// ❌ NIEMALS für Passwörter!
const hash = crypto.createHash('md5').update(password).digest('hex');
const hash = crypto.createHash('sha256').update(password).digest('hex');
```

**Warum?** MD5 und SHA sind *schnell* — sie können Milliarden von Hashes pro Sekunde berechnen. Ein Angreifer mit einer GPU kann alle möglichen kurzen Passwörter in Sekunden durchprobieren.

### Rainbow Tables

Ohne **Salt** können Angreifer vorberechnete Tabellen nutzen:

```
"password123" → "482c811da5d5b4bc6d497ffa98491e38"  (MD5, kein Salt)
```

Diese Hash-Werte sind in riesigen Tabellen vorberechnet. Wer einen solchen Hash findet, schlägt ihn einfach nach — kein Brute-Force nötig.

---

## Was du tun solltest: bcrypt

**bcrypt** wurde speziell für Passwörter entwickelt. Es ist *absichtlich langsam* und hat einen eingebauten Salt-Mechanismus.

```typescript
import bcrypt from 'bcrypt';

// Passwort hashen
async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 12;  // Kostenfaktor — höher = langsamer = sicherer
  return bcrypt.hash(plainPassword, saltRounds);
}

// Passwort verifizieren
async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

// Verwendung
const hash = await hashPassword('meinPasswort123');
// → "$2b$12$K1234abcdefghijklmnopXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
//   ↑ Algorithmus ↑ Kostenfaktor ↑ Salt (eingebettet im Hash!)

const isValid = await verifyPassword('meinPasswort123', hash);  // → true
const isValid = await verifyPassword('falschesPasswort', hash); // → false
```

Das `$2b$12$`-Präfix enthält bereits den Salt — du musst ihn nicht separat speichern.

---

## Der Kostenfaktor (Work Factor)

bcrypt's `saltRounds` bestimmt, wie lange das Hashing dauert:

| saltRounds | Hashes/Sekunde (2024 Consumer-CPU) | Empfehlung |
|---|---|---|
| 10 | ~128 | Minimum |
| 12 | ~32 | Standard (empfohlen) |
| 14 | ~8 | Für sensible Systeme |
| 16 | ~2 | Für sehr hohe Sicherheit |

Für Login-Formulare: 32 Hashes/Sekunde bedeutet, ein Angreifer kann nur 32 Passwörter/Sekunde probieren. Bei Millionen möglicher Passwörter: viele Jahre Rechenzeit.

> [!NOTE]
> 100ms pro Login-Versuch ist völlig akzeptabel für Nutzer, aber für Angreifer, die Millionen Passwörter probieren, ein riesiges Hindernis.

---

## Argon2 — der moderne Standard

**Argon2** gewann 2015 den Password Hashing Competition und gilt als sicherer als bcrypt:

```typescript
import argon2 from 'argon2';

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,  // Hybrid-Modus — empfohlen
    memoryCost: 65536,      // 64 MB RAM (schützt vor ASIC-Angriffe)
    timeCost: 3,            // 3 Iterationen
    parallelism: 4,         // 4 Threads
  });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
```

Argon2id nutzt viel RAM — das macht es schwerer, mit spezialisierter Hardware (ASICs) zu cracken.

---

## Passwort-Validierung vor dem Hashing

```typescript
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Mindestens 8 Zeichen')
  .max(128, 'Maximal 128 Zeichen')  // bcrypt schneidet bei >72 Bytes ab!
  .regex(/[A-Z]/, 'Mindestens ein Großbuchstabe')
  .regex(/[0-9]/, 'Mindestens eine Zahl');

function validatePassword(password: string): { valid: boolean; error?: string } {
  const result = passwordSchema.safeParse(password);
  return result.success
    ? { valid: true }
    : { valid: false, error: result.error.issues[0].message };
}
```

> [!IMPORTANT]
> bcrypt verarbeitet maximal **72 Bytes** — längere Passwörter werden einfach abgeschnitten! Wenn du längere Passwörter erlauben willst, pre-hashe sie mit SHA-256 oder nutze Argon2 statt bcrypt.

---

## Sicherer Login-Flow

```typescript
// Registration
async function registerUser(email: string, password: string) {
  // 1. Validieren
  const { valid, error } = validatePassword(password);
  if (!valid) throw new Error(error);

  // 2. Existiert der Nutzer bereits?
  const existing = await db.users.findByEmail(email);
  if (existing) {
    // Timing-Angriff verhindern: trotzdem hashen!
    await hashPassword(password);
    throw new Error('E-Mail bereits vergeben');
  }

  // 3. Hashen und speichern
  const passwordHash = await hashPassword(password);
  await db.users.create({ email, passwordHash });
}

// Login
async function loginUser(email: string, password: string) {
  const user = await db.users.findByEmail(email);

  if (!user) {
    // Timing-Angriff verhindern: trotzdem hashen!
    // Sonst kann ein Angreifer durch Antwortzeit erkennen, ob E-Mail existiert
    await bcrypt.compare(password, '$2b$12$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
    throw new Error('Ungültige Anmeldedaten');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error('Ungültige Anmeldedaten');

  return user;
}
```

Der Trick mit dem "trotzdem hashen": Wenn du bei unbekannter E-Mail sofort returnierst, kann ein Angreifer durch die kürzere Antwortzeit herausfinden, welche E-Mail-Adressen in deiner DB existieren (**Timing-Angriff**).

---

## Warum du eigentlich keine eigene Auth bauen solltest

```
❌ Eigene Auth bauen → bcrypt korrekt, Salt korrekt, Timing-Angriffe beachten,
   Brute-Force verhindern, Session-Management, Token-Rotation, ...

✓ Supabase Auth nutzen → alles oben automatisch korrekt
✓ Clerk nutzen → dasselbe
✓ NextAuth.js nutzen → dasselbe
```

Passwort-Hashing ist nur einer von Dutzenden Sicherheitsaspekten bei eigener Auth. Bewährte Auth-Libraries machen das alles automatisch richtig.

> [!IMPORTANT]
> **Für neue Projekte**: Nutze Supabase Auth, Clerk oder NextAuth. Nur wenn du spezifische Anforderungen hast, die keine Auth-Library erfüllt, implementiere eigene Passwort-Logik — und dann bitte immer mit bcrypt oder Argon2, niemals MD5/SHA.

---

## Wie Venator dir hilft

Venator empfiehlt für neue Projekte immer fertige Auth-Lösungen (Supabase Auth als Standard), die sicheres Passwort-Hashing automatisch übernehmen. Wenn du aus guten Gründen eigene Auth implementierst, zeigt Venator dir die richtigen Libraries und Algorithmen.

## Weiterführende Artikel

- [JWT vs Sessions: Was ist besser?](/learn/jwt-vs-sessions)
- [OAuth2 Flow Schritt für Schritt erklärt](/learn/oauth2-flow)
- [Sicherheitsgrundlagen für Web-Apps](/learn/security-basics)
