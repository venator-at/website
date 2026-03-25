---
title: "CQRS Pattern: Lesen und Schreiben trennen"
description: "CQRS (Command Query Responsibility Segregation) erklärt: Warum du Lese- und Schreiboperationen trennen solltest und wann dieses Muster wirklich sinnvoll ist."
category: "Architektur-Grundlagen"
order: 14
keywords: ["CQRS", "Command Query Responsibility Segregation", "Architekturmuster", "Event Sourcing", "Datenbankoptimierung"]
---

## Was ist CQRS?

**CQRS** steht für *Command Query Responsibility Segregation* — auf Deutsch: die Trennung der Verantwortlichkeiten für Befehle und Abfragen. Der Kern der Idee ist simpel:

- **Queries** (Abfragen) — lesen Daten, verändern nichts
- **Commands** (Befehle) — verändern Daten, geben nichts zurück

In den meisten CRUD-Anwendungen laufen Lesen und Schreiben über dasselbe Modell und dieselbe Datenbank. Das funktioniert prima — bis es nicht mehr funktioniert.

---

## Das Problem mit einem einzigen Modell

Stell dir eine E-Commerce-Plattform vor. Dein Produkt-Objekt hat 50 Felder: Name, Preis, Lagerbestand, Beschreibung, Bilder, Varianten, Rabatte, Steuern...

- Wenn ein **Nutzer ein Produkt ansieht**, braucht er nur: Name, Preis, Bilder (5 Felder)
- Wenn der **Admin das Produkt bearbeitet**, braucht er alle 50 Felder
- Wenn der **Lager-Service den Bestand prüft**, braucht er nur: Lagerbestand (1 Feld)

Mit einem einzigen Modell lädst du immer alle 50 Felder — auch wenn du nur 1 davon brauchst. Das ist langsam und ineffizient.

---

## CQRS: Die Lösung

CQRS sagt: Erstelle **separate Modelle** für Lesen und Schreiben.

```
┌─────────────────────────────────────────┐
│              Deine Anwendung            │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
  ┌────▼────┐    ┌─────▼─────┐
  │Commands │    │  Queries  │
  │(Schreiben)   │(Lesen)    │
  └────┬────┘    └─────┬─────┘
       │               │
  ┌────▼────┐    ┌─────▼─────┐
  │Write DB │    │  Read DB  │
  │(normalisiert)│(optimiert)│
  └─────────┘    └───────────┘
```

### Die Schreib-Seite (Commands)

Commands verändern den Zustand deiner Anwendung. Sie sind einfach und klar:

```typescript
// Command: Produkt-Preis aktualisieren
interface UpdateProductPriceCommand {
  productId: string;
  newPrice: number;
  updatedBy: string;
}

async function handleUpdateProductPrice(cmd: UpdateProductPriceCommand) {
  // Validierung
  if (cmd.newPrice <= 0) throw new Error('Preis muss positiv sein');

  // Schreibe in die Write-Datenbank
  await writeDb.products.update({
    where: { id: cmd.productId },
    data: { price: cmd.newPrice, updatedAt: new Date() }
  });

  // Optional: Event auslösen für Read-Side-Synchronisation
  await eventBus.emit('product.price_updated', cmd);
}
```

### Die Lese-Seite (Queries)

Queries sind für maximale Performance optimiert:

```typescript
// Query: Produktliste für die Startseite
interface GetFeaturedProductsQuery {
  limit: number;
  category?: string;
}

async function getFeaturedProducts(query: GetFeaturedProductsQuery) {
  // Liest aus einem optimierten Read-Modell
  // Kann eine separate DB, ein Cache oder eine materialisierte View sein
  return readDb.featuredProductsView.findMany({
    where: { category: query.category },
    take: query.limit,
    select: { id: true, name: true, price: true, imageUrl: true }
  });
}
```

---

## Muss ich zwei Datenbanken haben?

**Nein!** CQRS ist ein Spektrum:

### Stufe 1: Gleiche DB, getrennte Modelle (Einfach)

Dasselbe Datenbankschema, aber du trennst im Code sauber zwischen Lese- und Schreiboperationen. Das ist der ideale Einstieg.

### Stufe 2: Materialisierte Views (Mittel)

Du erstellst spezielle Datenbank-Views, die für häufige Abfragen optimiert sind. PostgreSQL unterstützt das nativ.

```sql
-- Materialisierte View für die Produktliste
CREATE MATERIALIZED VIEW featured_products_view AS
SELECT
  p.id, p.name, p.price, p.image_url,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as review_count
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
WHERE p.is_active = true
GROUP BY p.id;
```

### Stufe 3: Separate Read/Write-Datenbanken (Komplex)

Zwei vollständig separate Datenbanken, die über Events synchronisiert werden. Sinnvoll erst bei sehr hohem Traffic.

> [!NOTE]
> Starte mit **Stufe 1**. Die meisten Projekte brauchen nie mehr als das.

---

## CQRS und Event Sourcing

CQRS wird oft zusammen mit **Event Sourcing** erwähnt — die beiden sind aber **unabhängige Konzepte**. Du kannst CQRS ohne Event Sourcing einsetzen und umgekehrt.

Event Sourcing + CQRS ist ein mächtiges Duo für komplexe Domänen, aber für Anfänger oft zu komplex. Lerne erst CQRS, dann Event Sourcing.

---

## Wann CQRS einsetzen?

### Ja, wenn...
- Deine Lese-Operationen viel komplexer sind als deine Schreib-Operationen
- Du Performance-Probleme hast, die durch Index-Optimierung allein nicht lösbar sind
- Dein System stark wächst und du klare Grenzen ziehen möchtest

### Nein, wenn...
- Du eine einfache CRUD-App baust
- Dein Team noch keine Erfahrung mit fortgeschrittenen Mustern hat
- Du ein MVP baust — bring es erst zum Laufen, dann optimiere

> [!IMPORTANT]
> CQRS fügt Komplexität hinzu. Setze es nur ein, wenn du ein konkretes Problem damit löst — nicht weil es "best practice" klingt.

---

## Wie Venator dir hilft

Wenn du ein Projekt mit hohen Leseanforderungen beschreibst — z. B. ein Dashboard mit komplexen Statistiken — empfiehlt Venator, CQRS in Betracht zu ziehen. Im Architektur-Graph siehst du sofort, wo Read- und Write-Paths getrennt werden könnten.

Venator erklärt dir außerdem, ob du die einfache oder die komplexe CQRS-Variante brauchst — basierend auf deiner Projektgröße und deinem Erfahrungslevel.

## Weiterführende Artikel

- [Event-Driven Architecture erklärt](/learn/event-driven-architecture)
- [Datenbankabfragen optimieren](/learn/datenbankabfragen-optimieren)
- [Datenbankindexierung erklärt](/learn/datenbank-indexierung)
