---
title: "Datenbankindexierung erklärt"
description: "Datenbankindexierung einfach erklärt: Was Indizes sind, wie sie funktionieren, welche Typen es gibt und wie du mit den richtigen Indizes deine Abfragen drastisch beschleunigst."
category: "Datenbanken"
order: 25
keywords: ["Datenbankindex", "SQL Index", "PostgreSQL Index", "Datenbankoptimierung", "Query Performance"]
---

## Was ist ein Datenbankindex?

Stell dir vor, du hast eine Bibliothek mit 1.000.000 Büchern — unsortiert, ohne Katalog. Um ein Buch zu finden, müsstest du jeden einzelnen Band durchsuchen. Das dauert ewig.

Ein **Index** in einer Datenbank ist wie der Katalog in einer Bibliothek: Eine separate, schnell durchsuchbare Struktur, die dir sagt, wo die gesuchten Daten liegen.

Ohne Index: Datenbank liest **alle Zeilen** und filtert (Full Table Scan).
Mit Index: Datenbank springt **direkt** zu den richtigen Zeilen.

---

## Das einfachste Beispiel

```sql
-- Tabelle mit 10 Millionen Nutzern
SELECT * FROM users WHERE email = 'max@example.com';
```

**Ohne Index:** Datenbank liest alle 10 Millionen Zeilen → sehr langsam (mehrere Sekunden).

**Mit Index:**
```sql
CREATE INDEX idx_users_email ON users (email);
-- Jetzt dauert dieselbe Abfrage Millisekunden
```

Der B-Tree-Index auf `email` ermöglicht binäre Suche: Statt 10 Millionen Zeilen werden etwa 23 Vergleiche benötigt (log₂(10.000.000) ≈ 23).

---

## Wie Indizes intern funktionieren

### B-Tree-Index (Standard)

Der häufigste Indextyp. Stell dir einen balancierten Suchbaum vor:

```
                    [M]
                   /   \
              [D-H]     [R-T]
             /  |  \   /  |  \
            [D][F][H] [R][S][T]
```

Suche nach "F":
1. Vergleich mit "M" → gehe links
2. Vergleich mit "D-H" → gehe in die Mitte
3. Finde "F" → direkte Referenz auf die Zeile

Nur 3 Vergleiche statt alle zu lesen. Bei Millionen von Zeilen ist der Unterschied enorm.

---

## Indextypen in PostgreSQL

### 1. B-Tree-Index (Standard, für die meisten Fälle)

```sql
-- Gleichheitsvergleiche und Bereichsabfragen
CREATE INDEX idx_orders_created_at ON orders (created_at);

-- Effizient für:
WHERE created_at = '2024-03-01'
WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31'
WHERE created_at > '2024-01-01'
ORDER BY created_at DESC
```

### 2. Hash-Index (nur für Gleichheitsvergleiche)

```sql
CREATE INDEX idx_sessions_token ON sessions USING HASH (token);

-- Nur effizient für:
WHERE token = 'abc123'
-- NICHT für: WHERE token > 'abc'  (kein Bereich möglich)
```

### 3. GIN-Index (für Arrays und JSONB)

```sql
-- Für JSONB-Spalten
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);

-- Für Arrays
CREATE INDEX idx_articles_tags ON articles USING GIN (tags);

-- Effizient für:
WHERE attributes @> '{"color": "blau"}'  -- enthält
WHERE 'programming' = ANY(tags)
```

### 4. GiST-Index (für Geodaten und Ähnlichkeitssuche)

```sql
-- Mit PostGIS-Erweiterung
CREATE INDEX idx_stores_location ON stores USING GIST (location);

-- Effizient für Radius-Abfragen:
WHERE ST_DWithin(location, ST_MakePoint(13.4, 52.5)::geography, 5000);
```

---

## Zusammengesetzte Indizes (Composite Indexes)

Ein Index kann mehrere Spalten umfassen:

```sql
-- Index auf zwei Spalten
CREATE INDEX idx_orders_user_status ON orders (user_id, status);

-- Effizient für:
WHERE user_id = '...' AND status = 'pending'
WHERE user_id = '...'  -- auch nur erste Spalte nutzbar

-- NICHT effizient für:
WHERE status = 'pending'  -- erste Spalte fehlt!
```

> [!IMPORTANT]
> **Reihenfolge der Spalten ist entscheidend!** Setze die Spalte mit den meisten eindeutigen Werten (hohe Kardinalität) und die am häufigsten verwendete in WHERE-Bedingungen zuerst.

---

## Partial Indexes — Index nur für einen Teil der Daten

```sql
-- Nur offene Bestellungen indizieren (die meisten sind delivered)
CREATE INDEX idx_orders_pending ON orders (user_id)
WHERE status = 'pending';

-- Dieser Index ist viel kleiner und schneller als ein Vollindex
SELECT * FROM orders WHERE user_id = '...' AND status = 'pending';
```

Partial Indexes sind goldwert, wenn du häufig nach einem bestimmten Zustand filterst.

---

## Covering Indexes — alles im Index

```sql
-- INCLUDE-Spalten werden im Index gespeichert, müssen nicht separat gelesen werden
CREATE INDEX idx_users_email_covering ON users (email) INCLUDE (name, id);

-- Diese Abfrage liest NUR den Index, nie die eigentliche Tabelle!
SELECT id, name FROM users WHERE email = 'max@example.com';
```

---

## EXPLAIN ANALYZE — sieht deine Datenbank den Index?

```sql
-- Mit EXPLAIN ANALYZE siehst du, wie PostgreSQL deine Abfrage ausführt
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 'abc' AND status = 'pending';

-- Gute Ausgabe (Index wird genutzt):
-- Index Scan using idx_orders_user_status on orders  (cost=0.43..8.45)
--   Index Cond: ((user_id = 'abc') AND (status = 'pending'))
-- Planning Time: 0.1 ms
-- Execution Time: 0.2 ms

-- Schlechte Ausgabe (kein Index):
-- Seq Scan on orders  (cost=0.00..48320.00)
--   Filter: ((user_id = 'abc') AND (status = 'pending'))
-- Rows Removed by Filter: 2499998
-- Execution Time: 3240.5 ms
```

---

## Wann Indizes hinzufügen?

### Ja, wenn...

- Du regelmäßig nach einer Spalte filterst (`WHERE email = ...`)
- Du nach einer Spalte sortierst (`ORDER BY created_at`)
- Du Joins machst (`ON a.user_id = b.id` — Foreign Keys sollten immer indiziert sein)
- Deine Abfragen langsam sind und EXPLAIN zeigt Seq Scans

### Vorsicht bei...

- **Zu vielen Indizes**: Indizes verlangsamen Writes (INSERT, UPDATE, DELETE müssen den Index auch aktualisieren)
- **Kleinen Tabellen**: Bei < 1000 Zeilen sind Indizes meist unnötig
- **Spalten mit wenig Eindeutigkeit**: Index auf `gender` (nur 2-3 Werte) hilft kaum

---

## Goldene Regeln

1. **Index auf alle Foreign Keys** — immer
2. **Index auf Felder in WHERE-Bedingungen** — wenn die Tabelle groß ist
3. **Composite Index** — wenn du immer beide Felder zusammen filterst
4. **EXPLAIN ANALYZE** — vor und nach dem Index messen

> [!NOTE]
> Supabase hat im Dashboard einen eingebauten Query-Analyzer, der dir zeigt, welche Abfragen langsam sind und ob Indizes fehlen.

---

## Wie Venator dir hilft

Venator empfiehlt beim Datenbankdesign automatisch, wo Indizes sinnvoll sind — basierend auf deinem geplanten Datenmodell und deinen typischen Abfragemuster. Du siehst im Architektur-Überblick, welche Tabellen-Spalten indiziert sein sollten.

## Weiterführende Artikel

- [Datenbankabfragen optimieren](/learn/datenbankabfragen-optimieren)
- [ORM vs Raw SQL: Was solltest du wählen?](/learn/orm-vs-raw-sql)
- [PostgreSQL vs MySQL: Der direkte Vergleich](/learn/postgresql-vs-mysql)
