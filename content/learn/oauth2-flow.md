---
title: "OAuth2 Flow Schritt für Schritt erklärt"
description: "OAuth2 verständlich erklärt: Authorization Code Flow, PKCE, Tokens und warum du OAuth2 nie selbst implementieren solltest — mit konkreten Beispielen für Web-Apps."
category: "Authentifizierung & Sicherheit"
order: 30
keywords: ["OAuth2", "Authorization Code Flow", "PKCE", "Access Token", "Authentifizierung"]
---

## Was ist OAuth2 und warum brauchst du es?

Du kennst den "Mit Google anmelden"-Button. Wenn du darauf klickst, gibst du der App nicht dein Google-Passwort — stattdessen erlaubt Google der App, in deinem Namen bestimmte Dinge zu tun (z. B. deinen Namen und deine E-Mail lesen).

Das ist **OAuth2** in Aktion: Ein Protokoll, das einer Anwendung erlaubt, **im Namen eines Nutzers** auf Ressourcen zuzugreifen, ohne das Passwort des Nutzers zu kennen.

---

## Die Hauptakteure

```
┌──────────┐    ┌───────────────┐    ┌──────────────────┐
│  Nutzer  │    │  Deine App    │    │  Authorization   │
│          │    │  (Client)     │    │  Server (Google, │
│          │    │               │    │  GitHub, etc.)   │
└──────────┘    └───────────────┘    └──────────────────┘
```

- **Resource Owner**: Der Nutzer — besitzt die Daten
- **Client**: Deine App — will auf Daten zugreifen
- **Authorization Server**: Google, GitHub, etc. — stellt Tokens aus
- **Resource Server**: Die API, die die Daten hat (oft = Authorization Server)

---

## Authorization Code Flow — der sichere Standard

```
1. Nutzer klickt "Mit Google anmelden"
           ↓
2. Deine App leitet zu Google weiter:
   https://accounts.google.com/o/oauth2/auth?
     client_id=deine_app_id
     &redirect_uri=https://deine-app.com/callback
     &scope=email profile
     &response_type=code
     &state=zufälliger_wert_gegen_csrf
           ↓
3. Nutzer meldet sich bei Google an und erlaubt Zugriff
           ↓
4. Google leitet zurück zu deiner App:
   https://deine-app.com/callback?
     code=AUTH_CODE_123
     &state=zufälliger_wert_gegen_csrf
           ↓
5. Deine App tauscht den Code gegen Tokens:
   POST https://oauth2.googleapis.com/token
     code=AUTH_CODE_123
     client_id=...
     client_secret=...  (geheim! nur Server-seitig)
           ↓
6. Google antwortet mit:
   { access_token: "...", refresh_token: "...", expires_in: 3600 }
           ↓
7. Deine App nutzt Access Token für API-Anfragen:
   GET https://www.googleapis.com/oauth2/v1/userinfo
   Authorization: Bearer ACCESS_TOKEN
```

Der `code` in Schritt 4 ist nur einmal verwendbar und läuft schnell ab. Dein `client_secret` bleibt immer auf dem Server — **nie im Frontend!**

---

## PKCE — OAuth2 für Public Clients

Mobile Apps und Single-Page-Apps (SPAs) können kein `client_secret` sicher speichern — der Code ist im Bundle und damit öffentlich einsehbar.

**PKCE** (Proof Key for Code Exchange, gesprochen "Pixie") löst das:

```typescript
// 1. Code Verifier erstellen (zufällig)
const codeVerifier = crypto.randomBytes(32).toString('base64url');

// 2. Code Challenge berechnen (SHA-256 Hash des Verifiers)
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// 3. Authorization URL mit Challenge
const authUrl = `https://...?
  code_challenge=${codeChallenge}
  &code_challenge_method=S256
  ...`;

// 4. Beim Token-Tausch: Verifier mitschicken (kein client_secret!)
// POST /token
//   code=AUTH_CODE
//   code_verifier=codeVerifier  ← der Server prüft den Hash
```

Der Authorization Server kann den Hash verifizieren — ohne das Secret zu kennen.

---

## Access Token vs. Refresh Token

| | Access Token | Refresh Token |
|---|---|---|
| Lebensdauer | Kurz (1 Stunde) | Lang (Tage/Wochen/Jahre) |
| Verwendung | API-Anfragen | Neues Access Token holen |
| Wo speichern | Memory oder httpOnly-Cookie | Nur httpOnly-Cookie oder sicherer Speicher |
| Rotation | Nein | Ja (jeder Refresh = neues Refresh Token) |

```typescript
// Access Token automatisch erneuern
async function getValidAccessToken(): Promise<string> {
  if (!isExpired(accessToken)) {
    return accessToken;
  }

  // Access Token abgelaufen → Refresh Token nutzen
  const response = await fetch('/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: getRefreshToken(),
      client_id: 'deine_app_id',
    }),
  });

  const { access_token, refresh_token } = await response.json();
  saveTokens(access_token, refresh_token);
  return access_token;
}
```

---

## Scopes — was darf die App?

Scopes definieren, welche Berechtigungen der Nutzer erteilt:

```
scope=email profile          → nur Name und E-Mail lesen
scope=email profile calendar → auch Kalender zugreifen
scope=repo                   → GitHub-Repos lesen/schreiben
```

**Prinzip der minimalen Rechte**: Fordere nur die Scopes an, die du wirklich brauchst. Nutzer vertrauen Apps mehr, die nur wenig Zugriff verlangen.

> [!IMPORTANT]
> **Implementiere OAuth2 nie selbst von Grund auf!** Nutze fertige Libraries wie `next-auth`, Supabase Auth, Auth0 oder Clerk. OAuth2 korrekt zu implementieren ist komplex — kleine Fehler führen zu Sicherheitslücken.

---

## OAuth2 mit Supabase

```typescript
// Supabase übernimmt den gesamten OAuth2-Flow
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, anonKey);

// Google-Login starten — ein Aufruf reicht!
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'email profile',
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});

// Nach dem Redirect: Session abrufen
const { data: { session } } = await supabase.auth.getSession();
console.log(session?.user.email); // → max@gmail.com
```

---

## OAuth2 vs. OpenID Connect (OIDC)

OAuth2 ist für **Autorisierung** — eine App darf etwas tun.
**OpenID Connect (OIDC)** baut auf OAuth2 auf und fügt **Authentifizierung** hinzu — wer ist der Nutzer?

OIDC fügt einen `id_token` (ein JWT mit Nutzerinformationen) zum Antwortpaket hinzu. Die meisten modernen Auth-Flows (Google, GitHub) nutzen OIDC.

---

## Wie Venator dir hilft

Wenn du Auth-Anforderungen beschreibst — Login mit Google, GitHub oder Apple — empfiehlt Venator die passende Lösung. Für Next.js + Supabase ist der OAuth2-Flow bereits vollständig vorkonfiguriert, und Venator zeigt dir genau, welche Schritte nötig sind.

## Weiterführende Artikel

- [JWT vs Sessions: Was ist besser?](/learn/jwt-vs-sessions)
- [Authentifizierung Grundlagen](/learn/authentication)
- [RBAC vs ABAC: Zugriffskontrollen verstehen](/learn/rbac-vs-abac)
