---
title: "PostgreSQL vs MySQL: Der direkte Vergleich"
description: "PostgreSQL oder MySQL? Vergleich der zwei beliebtesten relationalen Datenbanken — mit klaren Empfehlungen, wann du welche für dein Projekt einsetzen solltest."
category: "Datenbanken"
order: 22
keywords: ["PostgreSQL", "MySQL", "relationale Datenbank", "SQL", "Datenbankvergleich"]
---

## PostgreSQL oder MySQL — welche Datenbank passt zu dir?

Wenn du eine relationale Datenbank brauchst, stehst du fast immer vor derselben Frage: PostgreSQL oder MySQL? Beide sind Open Source, beide sind seit Jahrzehnten bewährt, beide kannst du kostenlos nutzen.

Aber es gibt wichtige Unterschiede — und je nach Projekt kann die Wahl einen echten Unterschied machen.

---

## Ein kurzer Überblick

**MySQL** wurde 1995 entwickelt und war lange die Standarddatenbank für Web-Anwendungen — insbesondere durch den LAMP-Stack (Linux, Apache, MySQL, PHP). Facebook, Twitter und YouTube starteten mit MySQL.

**PostgreSQL** (oft "Postgres" abgekürzt) wurde 1986 als Forschungsprojekt an der UC Berkeley begonnen. Es gilt als technisch fortschrittlichere Datenbank mit einem stärkeren Fokus auf Standardkonformität und erweiterten Features.

---

## Der direkte Feature-Vergleich

| Feature | PostgreSQL | MySQL |
|---|---|---|
| ACID-Konformität | Vollständig | Vollständig (InnoDB) |
| JSON-Unterstützung | Exzellent (JSONB) | Gut (JSON) |
| Full-Text-Suche | Eingebaut | Eingebaut |
| Arrays | Nativ | Nicht nativ |
| Fenster-Funktionen | Ja | Ja (ab 8.0) |
| CTE (WITH-Klauseln) | Ja | Ja (ab 8.0) |
| Transaktionen | Vollständig | Vollständig |
| Stored Procedures | Ja | Ja |
| Partitionierung | Ja | Ja |
| Replikation | Logisch + Physisch | Logisch |
| Lizenz | PostgreSQL (sehr frei) | GPL / Kommerziell |

---

## Wo PostgreSQL glänzt

### 1. Komplexe Abfragen und Analytik

PostgreSQL's Query Planner ist bekannt für exzellente Performance bei komplexen Abfragen:

```sql
-- Beispiel: Window Functions für Rankings
SELECT
  product_name,
  category,
  sales,
  RANK() OVER (PARTITION BY category ORDER BY sales DESC) as rank_in_category,
  sales / SUM(sales) OVER (PARTITION BY category) * 100 as category_share_pct
FROM products;
```

### 2. JSONB — das Beste beider Welten

```sql
-- Speichere strukturierte JSON-Daten und query sie wie relationale Daten
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT,
  attributes JSONB  -- flexibles Schema
);

-- Abfragen mit Indexunterstützung
SELECT * FROM products WHERE attributes->>'color' = 'blau';

-- Index auf JSON-Feld
CREATE INDEX idx_products_color ON products ((attributes->>'color'));
```

### 3. Erweiterbarkeit

PostgreSQL hat ein einzigartiges Erweiterungssystem:
- **pgvector** — Vektorsuche für KI-Anwendungen
- **PostGIS** — Geo-Daten und Ortsabfragen
- **pg_trgm** — Fuzzy-Suche (Ähnlichkeitssuche)
- **TimescaleDB** — Zeitreihendaten

> [!NOTE]
> **Supabase** basiert auf PostgreSQL — und unterstützt alle diese Erweiterungen. Wenn du Supabase verwendest, bist du automatisch bei PostgreSQL.

---

## Wo MySQL glänzt

### 1. Lesezentrierte Workloads

MySQL (besonders mit dem MyISAM-Engine, obwohl InnoDB heute Standard ist) hat traditionell sehr schnelle Lesezugriffe. Für Read-Heavy-Anwendungen wie Blogs, News-Seiten oder Content-Plattformen ist MySQL eine solide Wahl.

### 2. Breitere Hosting-Unterstützung

Günstigere Shared-Hosting-Anbieter unterstützen oft MySQL, aber nicht PostgreSQL. Wenn du auf sehr günstigem Hosting bist, ist MySQL oft die einzige Option.

### 3. MariaDB-Kompatibilität

MySQL und MariaDB (der populäre MySQL-Fork) sind weitgehend kompatibel. Viele Projekte nutzen MariaDB als Drop-in-Ersatz.

---

## Performance-Vergleich

| Workload | PostgreSQL | MySQL |
|---|---|---|
| Komplexe Joins | Sehr gut | Gut |
| Einfache Reads | Gut | Sehr gut |
| Write-intensive | Sehr gut | Gut |
| Analytik | Sehr gut | Mittel |
| Full-Text-Suche | Gut | Gut |

Für die meisten Web-Anwendungen ist der Performance-Unterschied **vernachlässigbar**. Optimierung durch Indexierung und Query-Planung bringt mehr als die Wahl zwischen den beiden.

---

## Wann welche wählen?

### Wähle PostgreSQL, wenn...

- Du **Supabase** oder **Neon** als Hosting nutzt (beide = PostgreSQL)
- Du komplexe, analytische Abfragen brauchst
- Du **JSON-Daten** semi-strukturiert speichern möchtest (JSONB ist besser)
- Du **geographische Daten** (PostGIS) brauchst
- Du **KI-Features** planst (pgvector für Embeddings)
- Du kein spezifisches Argument für MySQL hast

### Wähle MySQL, wenn...

- Dein Hosting-Anbieter nur MySQL anbietet
- Dein Team ausschließlich MySQL-Erfahrung hat
- Du ein Legacy-System erweiterst, das MySQL nutzt
- Du MariaDB-spezifische Features brauchst

> [!IMPORTANT]
> Für neue Projekte ohne Legacy-Gründe: **Wähle PostgreSQL**. Es ist technisch überlegen, hat eine aktivere Community für moderne Web-Entwicklung, und alle modernen Hosting-Plattformen (Supabase, Neon, Railway, Render) unterstützen es erstklassig.

---

## Die Kosten

Beide sind Open Source und kostenlos. Die Kosten entstehen durch das Hosting:

| Provider | PostgreSQL | MySQL |
|---|---|---|
| Supabase | Ja (kostenloses Tier) | Nein |
| PlanetScale | Nein | Ja (MySQL-kompatibel) |
| Railway | Beide | Beide |
| Render | Beide | Beide |
| AWS RDS | Beide | Beide |
| Neon | Ja | Nein |

---

## Wie Venator dir hilft

Wenn du dein Projekt in Venator beschreibst, analysiert die KI deine Anforderungen und empfiehlt die passende Datenbank. Für neue Next.js/Supabase-Projekte erscheint PostgreSQL automatisch als Top-Empfehlung — mit konkreter Begründung und einem Link zu den Supabase-Docs.

## Weiterführende Artikel

- [Datenbankindexierung erklärt](/learn/datenbank-indexierung)
- [ORM vs Raw SQL: Was solltest du wählen?](/learn/orm-vs-raw-sql)
- [Datenbankmigrationen richtig durchführen](/learn/datenbankmigrationen)
