---
title: "Domain-Driven Design Grundlagen"
description: "Domain-Driven Design (DDD) einfach erklärt: Ubiquitous Language, Bounded Contexts und Aggregates — die wichtigsten Konzepte für komplexe Softwareprojekte."
category: "Architektur-Grundlagen"
order: 19
keywords: ["Domain-Driven Design", "DDD", "Bounded Context", "Ubiquitous Language", "Softwarearchitektur"]
---

## Was ist Domain-Driven Design?

Stell dir vor, du entwickelst Software für ein Krankenhaus. Auf der einen Seite: Ärzte, Pflegepersonal, Patienten, Behandlungen, Diagnosen. Auf der anderen Seite: Code, Klassen, Datenbanken, APIs.

**Domain-Driven Design (DDD)** ist ein Ansatz, der sagt: Dein Code soll die echte Welt so gut wie möglich widerspiegeln. Die Sprache der Experten (Ärzte, Buchhalter, Verkäufer) soll direkt im Code auftauchen — nicht in einem separaten "Übersetzungslayer".

Das klingt simpel, ist aber in der Praxis eine tiefe Designphilosophie, entwickelt von Eric Evans in seinem Buch "Domain-Driven Design" (2003).

---

## Die drei Kernkonzepte

### 1. Ubiquitous Language (Allgegenwärtige Sprache)

Das wichtigste Konzept in DDD: Entwickler und Domänenexperten verwenden **dieselbe Sprache**.

Schlecht:
- Experte sagt: "Wir stornieren eine Bestellung"
- Entwickler sagt: "Wir setzen den `status` auf `0` in der `orders`-Tabelle"

Gut:
```typescript
// Die Sprache der Experten lebt im Code
class Order {
  cancel(reason: CancellationReason): void {
    if (!this.canBeCancelled()) {
      throw new OrderAlreadyShippedError();
    }
    this.status = OrderStatus.CANCELLED;
    this.cancellationReason = reason;
    this.cancelledAt = new Date();
  }

  private canBeCancelled(): boolean {
    return this.status === OrderStatus.PENDING ||
           this.status === OrderStatus.CONFIRMED;
  }
}
```

Die Funktion heißt `cancel`, nicht `updateStatus`. Das ist Ubiquitous Language.

> [!NOTE]
> Ubiquitous Language ist das **einzige** DDD-Konzept, das sich für jedes Projekt lohnt — auch ohne den Rest von DDD.

### 2. Bounded Context (Abgegrenzter Kontext)

Ein großes System hat viele Teilbereiche, die ihre eigene Sprache haben. Dasselbe Wort bedeutet in verschiedenen Kontexten etwas anderes.

**Beispiel: "Kunde"**
- Im **Verkauf**: Potenzieller Käufer, hat Angebote bekommen
- In der **Buchhaltung**: Rechnungsempfänger, hat eine Kundennummer
- Im **Support**: Person mit einem offenen Ticket, hat Kontakthistorie

```
┌─────────────────────┐   ┌─────────────────────┐
│   Verkaufs-Kontext  │   │ Buchhaltungs-Kontext │
│                     │   │                      │
│  Kunde {            │   │  Kunde {             │
│    name             │   │    kundennummer      │
│    angebote         │   │    rechnungen        │
│    gesprächshistorie│   │    zahlungsstatus    │
│  }                  │   │  }                   │
└─────────────────────┘   └─────────────────────┘
```

Jeder Kontext hat **sein eigenes Modell des "Kunden"** — und das ist gut so! Wenn du versuchst, ein universelles Kunden-Objekt zu bauen, das alle Anforderungen erfüllt, wird es ein Monster.

### 3. Aggregates (Aggregate)

Ein Aggregate ist eine **Gruppe zusammengehöriger Objekte**, die als Einheit behandelt werden. Es hat eine **Root-Entity**, durch die alle Zugriffe laufen.

```typescript
// Bestellung-Aggregat
class Order {  // Root Entity
  private items: OrderItem[] = [];  // Teil des Aggregats
  private payment?: Payment;        // Teil des Aggregats

  addItem(productId: string, quantity: number, price: number): void {
    // Invariante: Nicht mehr als 50 Items
    if (this.items.length >= 50) {
      throw new TooManyItemsError();
    }
    this.items.push(new OrderItem(productId, quantity, price));
  }

  get total(): Money {
    return this.items.reduce((sum, item) => sum.add(item.subtotal), Money.zero());
  }
}

// ❌ Direkte Änderung eines Items ist NICHT erlaubt
// order.items[0].price = 99;

// ✅ Nur über das Root-Entity
// order.updateItemQuantity(itemId, newQuantity);
```

Aggregates schützen die **Invarianten** (Geschäftsregeln) deines Modells.

---

## Weitere wichtige Konzepte

### Entity vs. Value Object

**Entity**: Hat eine Identität — es gibt genau dieses eine Ding.
```typescript
class User {
  constructor(public readonly id: string, ...) {}
  // Zwei Users sind gleich, wenn ihre IDs gleich sind
}
```

**Value Object**: Hat keine Identität — zwei identische Werte sind austauschbar.
```typescript
class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: 'EUR' | 'USD'
  ) {}
  // Zwei Money-Objekte mit 10 EUR sind identisch — egal welches du nimmst

  add(other: Money): Money {
    if (other.currency !== this.currency) throw new CurrencyMismatchError();
    return new Money(this.amount + other.amount, this.currency);
  }
}
```

### Domain Events

```typescript
// Event, das in der Domäne passiert ist
class OrderPlacedEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly occurredAt: Date = new Date()
  ) {}
}
```

Domain Events ermöglichen lose Kopplung zwischen Bounded Contexts.

---

## DDD: Wann sinnvoll?

DDD ist **nicht für jedes Projekt** geeignet:

| Projekt | DDD sinnvoll? |
|---|---|
| Einfache CRUD-App | Nein |
| Blog / Content-Seite | Nein |
| E-Commerce mit Geschäftslogik | Ja |
| Banking / Finanzanwendung | Sehr sinnvoll |
| SaaS mit komplexen Workflows | Ja |
| MVP / erstes Projekt | Nein |

> [!IMPORTANT]
> DDD-Konzepte voll umzusetzen dauert Wochen des Lernens. **Starte mit der Ubiquitous Language** — das bringt sofort Nutzen. Den Rest lernst du, wenn dein Projekt wächst.

---

## Strategisches vs. Taktisches DDD

**Strategisches DDD** (die große Perspektive):
- Bounded Contexts definieren
- Context Map erstellen
- Teams aufteilen

**Taktisches DDD** (der Code):
- Entities, Value Objects, Aggregates
- Domain Events
- Repositories

Du kannst taktisches DDD nutzen, ohne strategisches DDD — und umgekehrt.

---

## Wie Venator dir hilft

Wenn du ein komplexes Projekt mit reicher Geschäftslogik beschreibst — z. B. eine Buchungsplattform oder ein Abrechnungssystem — empfiehlt Venator DDD als Architekturansatz. Du bekommst konkrete Erklärungen, welche Konzepte für dein Projekt relevant sind, ohne von der gesamten DDD-Theorie überwältigt zu werden.

## Weiterführende Artikel

- [Clean Architecture: Prinzipien einfach erklärt](/learn/clean-architecture)
- [Hexagonal Architecture für Einsteiger](/learn/hexagonal-architecture)
- [CQRS Pattern: Lesen und Schreiben trennen](/learn/cqrs-pattern)
