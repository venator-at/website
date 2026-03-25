---
title: "API-Keys sicher verwalten"
description: "API-Keys sicher verwalten: Wie du Secrets aus dem Code hältst, Environment Variables richtig nutzt, Keys rotierst und einen Key-Leak schnell behebst."
category: "Authentifizierung & Sicherheit"
order: 32
keywords: ["API-Keys", "Secrets Management", "Environment Variables", "Sicherheit", ".env"]
---

## Warum API-Keys so kritisch sind

Ein geleakter Stripe-API-Key kann dir Tausende Euro kosten. Ein geleakter OpenAI-Key kann zu massiven API-Rechnungen führen. Ein geleakter Supabase Service Role Key gibt jedem vollen Datenbankzugriff.

API-Keys sind wie Passwörter für deine Dienste — und sie werden erschreckend oft falsch behandelt.

---

## Die häufigsten Fehler

### Fehler 1: Keys im Code

```typescript
// ❌ NIEMALS so!
const stripe = new Stripe('sk_test_AbCdEfGhIjKlMnOpQrStUvWxYz');
const openai = new OpenAI({ apiKey: 'sk-proj-AbCdEfGhIjKl...' });
```

GitHub indexiert öffentliche Repositories. Bots scannen GitHub permanent nach API-Keys. Innerhalb von Minuten nach einem Commit kann ein geleakter Key gefunden und missbraucht werden.

### Fehler 2: `.env`-Datei commiten

```bash
# ❌ .env in .gitignore vergessen
git add .
git commit -m "add env config"  # .env landet im Repository!
```

### Fehler 3: Keys im Frontend

```typescript
// ❌ Im Browser sichtbar!
const apiKey = process.env.REACT_APP_SECRET_KEY;  // wird gebundelt
```

Alles, was im Frontend verwendet wird, ist öffentlich zugänglich.

---

## Die richtige Lösung: Environment Variables

```bash
# .env.local (niemals commiten!)
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
DATABASE_URL=postgresql://...
```

```bash
# .gitignore
.env
.env.local
.env.*.local
```

```typescript
// Im Code — Key kommt aus der Umgebung
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,  // ✓ nicht im Code
});
```

> [!IMPORTANT]
> Füge `.env` **als allererstes** zu `.gitignore` hinzu, bevor du irgendetwas commitest. Das ist der häufigste und gefährlichste Fehler bei neuen Projekten.

---

## Frontend vs. Backend Keys

Next.js macht den Unterschied deutlich:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...      # Mit NEXT_PUBLIC_ → sicher im Frontend
NEXT_PUBLIC_SUPABASE_ANON_KEY=... # Mit NEXT_PUBLIC_ → sicher im Frontend

SUPABASE_SERVICE_ROLE_KEY=...     # OHNE NEXT_PUBLIC_ → NUR Server-seitig
ANTHROPIC_API_KEY=...             # OHNE NEXT_PUBLIC_ → NUR Server-seitig
STRIPE_SECRET_KEY=...             # OHNE NEXT_PUBLIC_ → NUR Server-seitig
```

Der Supabase Anon Key ist **öffentlich** — er ist so designed (Row Level Security schützt die Daten). Der Service Role Key bypasst RLS und gehört **nur auf den Server**.

---

## Keys sicher speichern — nach Umgebung

### Lokale Entwicklung: .env.local

```bash
# Erstellt eine Vorlage für andere Entwickler
# .env.example (commitbar, ohne echte Werte)
ANTHROPIC_API_KEY=          # Claude API Key von console.anthropic.com
SUPABASE_SERVICE_ROLE_KEY=  # Von Supabase Dashboard → Settings → API
STRIPE_SECRET_KEY=          # Von Stripe Dashboard → Developers → API Keys
```

### Produktion: Secrets Management

**Vercel:** Environment Variables im Dashboard (verschlüsselt gespeichert)
```
Vercel Dashboard → Project → Settings → Environment Variables
→ Key: ANTHROPIC_API_KEY, Value: sk-ant-...
→ Environment: Production
```

**Railway / Render:** Eigene "Secrets"-Sektion im Dashboard

**AWS:** AWS Secrets Manager oder Parameter Store

---

## API-Keys mit Ablaufdatum und Rotation

```typescript
// Gutes API-Key-Design für eigene Systeme
interface ApiKey {
  id: string;
  key: string;         // Nur der Hash wird gespeichert, nie der Klartext!
  name: string;        // z. B. "CI/CD Pipeline" oder "Mobile App v2"
  expiresAt: Date;     // Ablaufdatum erzwingen
  lastUsedAt: Date;
  scopes: string[];    // Minimale Rechte
}

// API-Key erstellen
async function createApiKey(userId: string, name: string): Promise<string> {
  const rawKey = `vnt_${crypto.randomBytes(32).toString('hex')}`;  // Prefix für Erkennung
  const keyHash = await bcrypt.hash(rawKey, 10);

  await db.apiKeys.create({
    userId,
    keyHash,
    name,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),  // 1 Jahr
    scopes: ['read'],
  });

  return rawKey;  // Einmal dem Nutzer zeigen, dann nie wieder!
}
```

---

## Was tun bei einem Key-Leak?

1. **Sofort widerrufen** (Revoke) — geht immer zuerst!
   - Stripe: Dashboard → Developers → API Keys → Roll
   - OpenAI: Platform → API Keys → Delete
   - GitHub: Settings → Developer Settings → Personal Access Tokens → Delete

2. **Git-History bereinigen** (falls committed)
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env' \
     --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```

3. **Schaden bewerten**: Welche API? Welche Zeitspanne? Was könnte passiert sein?

4. **Neuen Key generieren** und sicher speichern

> [!NOTE]
> GitHub hat einen "Secret Scanning"-Dienst, der automatisch bekannte API-Key-Formate erkennt und den jeweiligen Provider benachrichtigt. Stripe, OpenAI und GitHub rotieren Keys manchmal sogar automatisch, wenn sie in einem Public Repo gefunden werden.

---

## Weitere Best Practices

### Minimale Rechte (Principle of Least Privilege)

```
❌ Stripe Secret Key (voller Zugriff)
✓ Stripe Restricted Key (nur für Checkout nötige Endpoints)
```

### Verschiedene Keys pro Umgebung

```bash
# Nicht denselben Key für Dev und Prod!
STRIPE_SECRET_KEY=sk_test_...  # Entwicklung (Testmodus)
STRIPE_SECRET_KEY=sk_live_...  # Produktion (echter Modus)
```

### Keys benennen und dokumentieren

Wenn du in Stripe oder GitHub einen API-Key erstellst, gib ihm einen aussagekräftigen Namen:
- "Production - Vercel Deployment"
- "CI/CD - GitHub Actions"
- "Development - Max Laptop"

So weißt du sofort, welcher Key wofür genutzt wird — und welcher gelöscht werden kann, wenn jemand das Team verlässt.

---

## Wie Venator dir hilft

Venator erklärt bei jeder empfohlenen Technologie, welche Keys du brauchst, welche öffentlich sein dürfen und welche streng geheim bleiben müssen. In der Architektur-Übersicht siehst du auf einen Blick, welche Services Server-seitige Keys benötigen.

## Weiterführende Artikel

- [Environment Variables richtig verwalten](/learn/environment-variables)
- [CSRF und XSS: Angriffe verstehen und abwehren](/learn/csrf-xss-schutz)
- [Sicherheitsgrundlagen für Web-Apps](/learn/security-basics)
