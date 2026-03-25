---
title: "MongoDB vs PostgreSQL: Dokumenten- vs. Relational"
description: "MongoDB oder PostgreSQL? Verständlicher Vergleich zwischen Dokumenten- und relationalen Datenbanken — mit konkreten Anwendungsfällen und Empfehlungen für Einsteiger."
category: "Datenbanken"
order: 24
keywords: ["MongoDB", "PostgreSQL", "NoSQL", "relationale Datenbank", "Datenbankvergleich"]
---

## Zwei grundlegend verschiedene Ansätze

Wenn du eine Datenbank auswählst, triffst du nicht nur eine technische Entscheidung — du entscheidest auch, wie du über deine Daten denkst.

**PostgreSQL** denkt in **Tabellen und Zeilen**: Strukturierte Daten mit festen Spalten, Beziehungen durch Foreign Keys, strenge Typen.

**MongoDB** denkt in **Dokumenten**: Flexible JSON-ähnliche Objekte, die unterschiedliche Felder haben können, keine fixe Struktur erzwungen.

---

## Wie Daten gespeichert werden

### PostgreSQL: Tabellen und Zeilen

```sql
-- Nutzer-Tabelle
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bestellungen-Tabelle (verknüpft mit Users)
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL
);
```

Jede Bestellung referenziert einen Nutzer über dessen ID. Das ist **normalisiert** — Daten werden nicht dupliziert.

### MongoDB: Dokumente

```javascript
// Ein Nutzer-Dokument (mit eingebetteten Bestellungen)
{
  "_id": "64abc123",
  "email": "max@example.com",
  "name": "Max Müller",
  "orders": [
    {
      "orderId": "ord_1",
      "total": 49.99,
      "status": "delivered",
      "items": [
        { "productId": "prod_1", "name": "Tastatur", "price": 49.99 }
      ]
    }
  ],
  "preferences": {
    "newsletter": true,
    "theme": "dark"
  }
}
```

Bestellungen können direkt im Nutzer-Dokument gespeichert werden. Das ist **denormalisiert** — du duplizierst Daten, aber Abfragen sind einfacher.

---

## Der Kern-Unterschied: Schema

**PostgreSQL** erzwingt ein Schema:

```sql
-- Du MUSST alle Felder definieren
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
-- → Alle vorhandenen Zeilen haben jetzt phone = NULL
```

**MongoDB** ist schema-flexibel:

```javascript
// Dokument 1
{ "_id": "1", "name": "Max", "email": "max@example.com" }

// Dokument 2 — komplett anderes Schema, völlig OK!
{ "_id": "2", "name": "Anna", "email": "anna@example.com", "phone": "+49123456", "age": 28 }
```

Das klingt praktisch — aber es macht es schwieriger sicherzustellen, dass deine Daten konsistent sind.

---

## Beziehungen: Joins vs. Einbettung

**PostgreSQL** — Beziehungen durch Joins:

```sql
-- Nutzer mit allen Bestellungen abrufen
SELECT u.name, o.total, o.status
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.id = '...'
ORDER BY o.created_at DESC;
```

**MongoDB** — zwei Ansätze:

```javascript
// Ansatz 1: Einbettung (Embedding)
// Bestellung liegt direkt im Nutzer-Dokument
db.users.findOne({ "_id": "64abc123" });
// → Gibt Nutzer + alle Bestellungen in einer Abfrage zurück

// Ansatz 2: Referenzen (wie SQL Foreign Keys)
// orders.userId referenziert users._id
db.orders.find({ userId: "64abc123" });
```

MongoDB empfiehlt **Einbettung**, wenn du Daten immer zusammen liest. Wenn Daten oft separat abgefragt werden, nutze Referenzen.

---

## Vergleich: Stärken und Schwächen

| Kriterium | PostgreSQL | MongoDB |
|---|---|---|
| Schema | Strikt, sicher | Flexibel, entwicklerfreundlich |
| Beziehungen | Exzellent (Joins) | Begrenzt (Embedding/Referenzen) |
| Transaktionen | ACID-konform | ACID-konform (ab 4.0, komplexer) |
| Horizontale Skalierung | Aufwendiger | Einfacher (Sharding eingebaut) |
| Aggregationen | SQL (mächtig) | Aggregation Pipeline |
| JSON-Daten | JSONB (sehr gut) | Native (natürlich) |
| Lernkurve | SQL lernen | Einfacher für Anfänger |
| Ökosystem | Sehr reif | Reif |

---

## Wann MongoDB sinnvoll ist

### 1. Sehr unterschiedliche Datenstrukturen

Wenn deine Dokumente sehr unterschiedliche Felder haben — z. B. Produktkatalog mit Elektronik (Watt, Volt) vs. Kleidung (Größe, Material) — ist MongoDB natürlicher.

### 2. Schnelle Iterationen

Wenn du deinen Datenlayer häufig anpasst und Migrationen vermeiden willst:

```javascript
// Einfach ein neues Feld hinzufügen — keine Migration nötig
await db.products.updateOne(
  { _id: productId },
  { $set: { sustainabilityScore: 8.5 } }
);
// Alte Dokumente ohne das Feld koexistieren problemlos
```

### 3. Eingebettete Dokumente als natürliches Modell

Wenn deine Daten natürlich hierarchisch sind und du sie immer zusammen liest (z. B. Blog-Post + Kommentare), ist Einbettung elegant.

---

## Wann PostgreSQL klar besser ist

### 1. Komplexe Beziehungen

```sql
-- Wer hat welche Produkte in derselben Kategorie wie Nutzer 42 gekauft?
SELECT DISTINCT u.name
FROM users u
JOIN orders o ON o.user_id = u.id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE p.category_id IN (
  SELECT DISTINCT p2.category_id
  FROM orders o2
  JOIN order_items oi2 ON oi2.order_id = o2.id
  JOIN products p2 ON p2.id = oi2.product_id
  WHERE o2.user_id = 42
);
```

Das in MongoDB? Sehr aufwendig.

### 2. Transaktionen über mehrere Dokumente

Wenn du z. B. sicherstellen musst, dass Zahlung und Bestellerstellung atomar passieren, ist PostgreSQL deutlich einfacher.

### 3. Analytik und Reporting

SQL ist unschlagbar für komplexe Analysen, Gruppierungen und Aggregationen.

> [!IMPORTANT]
> **Für die meisten Web-Apps empfehlen wir PostgreSQL** — besonders wenn du Supabase verwendest. Die Flexibilität von MongoDB wird oft überschätzt: Mit PostgreSQL's JSONB-Spalten bekommst du das Beste aus beiden Welten für flexible Daten, ohne auf SQL-Joins verzichten zu müssen.

---

## Das hybride Modell: PostgreSQL mit JSONB

```sql
-- Das Beste aus beiden Welten
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  base_price DECIMAL(10,2) NOT NULL,
  attributes JSONB  -- Flexible Felder pro Produkttyp
);

-- Elektronik
INSERT INTO products VALUES (
  gen_random_uuid(), 'Laptop', 'cat_electronics', 999.00,
  '{"watt": 65, "ram_gb": 16, "storage_gb": 512}'
);

-- Kleidung
INSERT INTO products VALUES (
  gen_random_uuid(), 'T-Shirt', 'cat_clothing', 29.00,
  '{"sizes": ["S", "M", "L", "XL"], "material": "Baumwolle"}'
);

-- Abfragen über JSONB mit Index
SELECT * FROM products WHERE attributes->>'material' = 'Baumwolle';
```

---

## Wie Venator dir hilft

Venator analysiert dein Datenbankmodell und empfiehlt, ob PostgreSQL, MongoDB oder ein hybrides Modell am besten passt. Für die meisten Projekte mit Supabase erscheint PostgreSQL als erste Empfehlung — mit einer klaren Erklärung, warum JSONB flexiblen Anforderungen gerecht wird.

## Weiterführende Artikel

- [PostgreSQL vs MySQL: Der direkte Vergleich](/learn/postgresql-vs-mysql)
- [Vektor-Datenbanken und KI-Anwendungen](/learn/vektor-datenbanken)
- [Datenbankdesign Grundlagen](/learn/database-design)
