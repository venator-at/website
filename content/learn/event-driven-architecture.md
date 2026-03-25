---
title: "Event-Driven Architecture erklärt"
description: "Event-Driven Architecture einfach erklärt: Wie Systeme über Ereignisse kommunizieren, wann du dieses Muster brauchst und wie du startest."
category: "Architektur-Grundlagen"
order: 13
keywords: ["Event-Driven Architecture", "EDA", "Message Queue", "Event Sourcing", "Architekturmuster"]
---

## Was ist Event-Driven Architecture?

Stell dir vor, du bestellt ein Paket online. Wenn du auf "Kaufen" drückst, passieren viele Dinge gleichzeitig: das Lager wird informiert, die Buchhaltung verbucht die Zahlung, du bekommst eine E-Mail. Niemand wartet auf den anderen — alle reagieren auf das **Ereignis** "Bestellung aufgegeben".

Genau das ist **Event-Driven Architecture (EDA)**: Systeme kommunizieren nicht direkt miteinander, sondern über **Ereignisse** (Events). Ein Dienst sendet ein Event ("Bestellung erstellt"), und alle anderen Dienste, die daran interessiert sind, reagieren darauf.

Dieser Artikel erklärt, wie EDA funktioniert, wann sie sinnvoll ist und wann nicht.

---

## Die drei Hauptkonzepte

### 1. Event (Ereignis)

Ein Event ist eine **Nachricht, dass etwas passiert ist**. Events sind immer in der Vergangenheit formuliert:

- `user.registered` — Ein neuer Nutzer hat sich registriert
- `order.placed` — Eine Bestellung wurde aufgegeben
- `payment.failed` — Eine Zahlung ist fehlgeschlagen

Ein Event enthält typischerweise eine ID, einen Zeitstempel und relevante Daten:

```json
{
  "type": "order.placed",
  "timestamp": "2024-03-15T10:30:00Z",
  "data": {
    "orderId": "ord_123",
    "userId": "usr_456",
    "totalAmount": 49.99
  }
}
```

### 2. Event Producer (Sender)

Der **Producer** erzeugt Events und sendet sie — ohne zu wissen, wer zuhört. Das ist der entscheidende Unterschied zu direkten API-Aufrufen: Der Sender interessiert sich nicht dafür, wer reagiert.

### 3. Event Consumer (Empfänger)

Der **Consumer** abonniert bestimmte Events und reagiert darauf. Es können mehrere Consumer auf dasselbe Event hören:

```
order.placed → [Lager-Service, E-Mail-Service, Analytics-Service]
```

---

## Synchron vs. Asynchron

Das ist der wichtigste Unterschied:

| | Synchron (REST) | Asynchron (EDA) |
|---|---|---|
| Ablauf | Service A ruft Service B direkt auf und **wartet** | Service A sendet Event, macht weiter |
| Kopplung | Eng (A kennt B) | Lose (A kennt nur das Event) |
| Fehlertoleranz | B-Ausfall bricht A | B-Ausfall staut Events, kein Datenverlust |
| Komplexität | Einfach | Komplexer |

---

## Message Queues und Event Buses

Events brauchen eine **Infrastruktur**, die sie transportiert:

- **Redis Streams** — einfach, gut für kleinere Systeme
- **Apache Kafka** — extrem skalierbar, für große Datenmengen
- **RabbitMQ** — flexibel, gut für Unternehmensanwendungen
- **AWS SQS/SNS** — einfach zu nutzen, managed Service
- **Supabase Realtime** — für einfache Realtime-Features in kleineren Apps

> [!NOTE]
> Für dein erstes Projekt mit EDA: Starte mit **Redis Streams** oder **Supabase Realtime**. Kafka ist erst bei sehr großen Datenmengen sinnvoll.

---

## Wann EDA einsetzen?

### Gute Anwendungsfälle

- **E-Commerce**: Bestellung → Lagerverwaltung + E-Mail + Analytics
- **Benachrichtigungssysteme**: Nutzeraktionen triggern Push-Notifications
- **Audit Logs**: Jede Aktion wird als Event protokolliert
- **Microservices-Kommunikation**: Dienste sollen voneinander unabhängig bleiben

### Wann lieber nicht?

- **Einfache CRUD-Apps**: REST ist einfacher und reicht völlig
- **Wenn sofortige Antwort nötig ist**: Zahlungsstatus muss synchron sein
- **Kleine Teams ohne Ops-Erfahrung**: EDA-Infrastruktur braucht Wartung

---

## Ein einfaches Beispiel in Node.js

```typescript
import { EventEmitter } from 'events';

const eventBus = new EventEmitter();

// Consumer: E-Mail-Service
eventBus.on('user.registered', (data) => {
  console.log(`Willkommens-E-Mail senden an: ${data.email}`);
  // sendWelcomeEmail(data.email);
});

// Consumer: Analytics-Service
eventBus.on('user.registered', (data) => {
  console.log(`Neue Registrierung tracken: ${data.userId}`);
});

// Producer: Auth-Service
function registerUser(email: string) {
  const userId = 'usr_' + Date.now();
  // ... Nutzer in DB speichern ...

  // Event auslösen
  eventBus.emit('user.registered', { userId, email });
}

registerUser('max@example.com');
```

> [!IMPORTANT]
> Dies ist ein vereinfachtes In-Process-Beispiel. In der Produktion nutzt du eine externe Message Queue (Redis, Kafka, etc.), damit Events auch nach einem Neustart nicht verloren gehen.

---

## Event Sourcing — der nächste Schritt

Event Sourcing ist eine Variante von EDA, bei der du **nicht den aktuellen Zustand** speicherst, sondern **alle Events**, die zu diesem Zustand geführt haben.

Statt `balance: 150€` speicherst du:
1. `account.created` (balance: 0€)
2. `money.deposited` (amount: 200€)
3. `money.withdrawn` (amount: 50€)

Du kannst den Kontostand jederzeit neu berechnen. Das ist mächtig, aber auch komplex — für Einsteiger meist überdimensioniert.

---

## Wie Venator dir hilft

Wenn du ein Projekt mit mehreren unabhängigen Diensten beschreibst — zum Beispiel einen E-Commerce-Shop mit Lager, Zahlungen und Benachrichtigungen — empfiehlt Venator event-basierte Kommunikation und zeigt im Architektur-Graph, welche Services miteinander kommunizieren.

Du siehst auf einen Blick, welche Events zwischen den Komponenten fließen, und bekommst konkrete Tool-Empfehlungen (z. B. Redis Streams für den Anfang).

## Weiterführende Artikel

- [CQRS Pattern: Lesen und Schreiben trennen](/learn/cqrs-pattern)
- [Serverless Architecture: Vor- und Nachteile](/learn/serverless-architecture)
- [Monitoring und Logging für Einsteiger](/learn/monitoring-logging)
