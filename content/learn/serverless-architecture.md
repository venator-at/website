---
title: "Serverless Architecture: Vor- und Nachteile"
description: "Serverless Architecture verständlich erklärt: Was Funktionen-as-a-Service bedeutet, wann Serverless die richtige Wahl ist und was die versteckten Kosten sind."
category: "Architektur-Grundlagen"
order: 18
keywords: ["Serverless", "FaaS", "AWS Lambda", "Vercel Functions", "Cloud-Architektur"]
---

## Was bedeutet Serverless?

Der Name ist etwas irreführend: **"Serverless" bedeutet nicht, dass es keine Server gibt**. Es bedeutet, dass du dich nicht darum kümmern musst. Du schreibst eine Funktion — und jemand anderes (AWS, Vercel, Google Cloud) kümmert sich darum, wann und wie diese Funktion ausgeführt wird.

Das klassische Modell: Du kaufst oder mietest einen Server, installierst dort deine App, und der Server läuft 24/7 — egal ob gerade jemand deine App nutzt oder nicht.

Das Serverless-Modell: Du schreibst Funktionen. Wenn eine Anfrage kommt, wird die Funktion ausgeführt. Wenn keine Anfrage kommt, läuft nichts — und du zahlst nichts.

---

## Funktionen-as-a-Service (FaaS)

Der Kern von Serverless ist **FaaS** — du deployst einzelne Funktionen, keine ganze App:

```typescript
// Eine Serverless-Funktion bei Vercel
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') ?? 'Welt';

  return Response.json({
    message: `Hallo, ${name}!`,
    timestamp: new Date().toISOString(),
  });
}
```

Diese Funktion wird automatisch skaliert: Bei 1 Anfrage läuft sie einmal. Bei 10.000 gleichzeitigen Anfragen läuft sie 10.000 mal parallel. Du musst nichts konfigurieren.

---

## Die großen Serverless-Plattformen

| Plattform | Stärke | Ideal für |
|---|---|---|
| **Vercel Functions** | Next.js-Integration, einfach | Web-Apps mit Next.js |
| **AWS Lambda** | Mächtigste Plattform | Enterprise, komplexe Workflows |
| **Cloudflare Workers** | Edge-Netzwerk, schnell | Globale Low-Latency |
| **Google Cloud Functions** | GCP-Integration | Google-Cloud-Nutzer |
| **Netlify Functions** | Einfach, gut für Jamstack | Statische Sites mit API |
| **Supabase Edge Functions** | Deno-basiert | Supabase-Projekte |

---

## Die Vorteile von Serverless

### 1. Kein Server-Management
Kein SSH, kein "warum läuft der Server nicht?", kein Patchen von Betriebssystemen. Du schreibst Code — der Rest ist ausgelagert.

### 2. Automatische Skalierung
```
Normale Last: 1 Funktionsinstanz
Black Friday: 50.000 Funktionsinstanzen
Danach: zurück zu 1
```

Du musst nie im Voraus für Spitzenlast planen.

### 3. Pay-per-Use
Du zahlst nur, wenn deine Funktionen ausgeführt werden — nicht für Leerlaufzeiten.

**Beispiel AWS Lambda:**
- 1 Million Anfragen/Monat kostenlos
- Danach: ~$0.0000002 pro Anfrage
- 100 ms Ausführungszeit bei 128 MB RAM: ~$0.000000208

Für viele Startups: **praktisch kostenlos** in der Anfangsphase.

### 4. Schneller Time-to-Market
```bash
# Deploy mit Vercel: ein Befehl
vercel --prod
```

Dein Code ist sofort weltweit verfügbar, ohne Infrastruktur-Konfiguration.

---

## Die Nachteile — was alle verschweigen

### 1. Cold Starts

Wenn eine Serverless-Funktion längere Zeit nicht aufgerufen wurde, muss sie beim nächsten Aufruf erst "aufgewärmt" werden. Das kostet Zeit:

- **Warme Funktion**: 10-50 ms
- **Kalte Funktion (Cold Start)**: 200-3000 ms (bei Java/Python oft mehr)

Node.js und Cloudflare Workers haben hier deutlich kürzere Cold Starts als Java oder Python.

> [!NOTE]
> Cold Starts sind bei Vercel und Cloudflare Workers meist kein großes Problem. Bei AWS Lambda mit Java-Runtimes können sie jedoch spürbar sein.

### 2. Maximale Ausführungszeit

Serverless-Funktionen dürfen nicht ewig laufen:

| Plattform | Max. Ausführungszeit |
|---|---|
| Vercel (Hobby) | 10 Sekunden |
| Vercel (Pro) | 60 Sekunden |
| AWS Lambda | 15 Minuten |
| Cloudflare Workers | 30 Sekunden |

Für lange Berechnungen, Video-Encoding oder große Daten-Importe ist Serverless ungeeignet.

### 3. Kein persistenter Zustand

```typescript
// ❌ Das funktioniert NICHT zuverlässig in Serverless
let counter = 0;

export function GET() {
  counter++; // Wird bei jeder Instanz neu gestartet
  return Response.json({ count: counter });
}
```

Jede Funktionsinstanz ist stateless. Zustand muss in einer Datenbank oder einem Cache gespeichert werden.

### 4. Komplexes Debugging

Logs sind verteilt über viele Instanzen. Lokales Testen ist umständlicher als bei einem normalen Server.

### 5. Vendor Lock-in

Wenn du AWS-Lambda-spezifische Features nutzt, kannst du nicht einfach zu Vercel wechseln. Halte Serverless-Funktionen daher so generisch wie möglich.

> [!IMPORTANT]
> Vermeide es, AWS-SDK-spezifischen Code direkt in deine Handler-Funktion zu schreiben. Kapsle ihn in eine eigene Klasse/Modul — so bleibt dein Code portabler.

---

## Serverless vs. Container vs. klassischer Server

| | Serverless | Container (Docker) | Server/VM |
|---|---|---|---|
| Management | Keines | Mittel | Viel |
| Skalierung | Automatisch | Manuell/Auto | Manuell |
| Cold Starts | Ja | Nein | Nein |
| Max. Laufzeit | Begrenzt | Unbegrenzt | Unbegrenzt |
| Kosten (niedrige Last) | Sehr gering | Moderat | Fest |
| Kosten (hohe Last) | Kann teuer werden | Vorhersehbar | Vorhersehbar |
| Persistenter Zustand | Nein | Ja | Ja |

---

## Wann Serverless wählen?

### Perfekt für:
- **API-Endpunkte** mit variabler Last
- **Webhooks** (Stripe, GitHub, etc.)
- **Scheduled Jobs** (täglich um Mitternacht ausführen)
- **Image/File-Processing** bei Upload
- **Authentifizierungs-Middleware**

### Nicht geeignet für:
- **Long-Running Jobs** (Video-Rendering, ML-Training)
- **WebSocket-Server** (persistente Verbindungen)
- **Datenbank-Server** (brauchen persistenten Zustand)
- **Hochfrequente Anfragen** (Cache-Warming-Kosten)

---

## Wie Venator dir hilft

Venator analysiert dein Projekt und empfiehlt Serverless, wenn es passt — zum Beispiel für API-Endpunkte in einer Next.js-App auf Vercel. Wenn dein Projekt Long-Running-Prozesse oder persistenten Zustand auf Server-Ebene braucht, weist Venator darauf hin und schlägt Alternativen vor.

Du siehst im Architektur-Graph, welche Teile deines Systems gut zu Serverless passen und welche besser auf einem klassischen Server laufen.

## Weiterführende Artikel

- [Vercel vs AWS: Was passt zu deinem Projekt?](/learn/vercel-vs-aws)
- [Edge Computing und CDN erklärt](/learn/edge-computing-cdn)
- [Docker für Entwickler: Ein praktischer Einstieg](/learn/docker-fuer-entwickler)
