---
title: "ORM vs Raw SQL: Was solltest du wählen?"
description: "ORM oder Raw SQL? Vergleich von Prisma, Drizzle und direktem SQL — mit Vor- und Nachteilen, Code-Beispielen und einer klaren Empfehlung für verschiedene Projekttypen."
category: "Datenbanken"
order: 26
keywords: ["ORM", "Prisma", "Drizzle ORM", "Raw SQL", "Datenbankzugriff"]
---

## Das ewige Dilemma: ORM oder direktes SQL?

Wenn du mit einer Datenbank sprichst, hast du zwei Hauptwege:

**ORM** (Object-Relational Mapper): Eine Library, die Datenbankoperationen in Objekte und Methoden übersetzt. Du schreibst TypeScript-Code, das ORM schreibt SQL.

**Raw SQL**: Du schreibst SQL direkt. Keine Abstraktion, volle Kontrolle.

Beide Ansätze haben ihre Berechtigung — und viele Projekte kombinieren beides.

---

## Was ist ein ORM?

Ein ORM mappt deine Datenbanktabellen auf Klassen/Objekte in deinem Code:

```typescript
// Mit Prisma ORM — kein SQL nötig
const user = await prisma.user.findUnique({
  where: { email: 'max@example.com' },
  include: { orders: true }
});

// Mit Raw SQL (pg-Library)
const result = await db.query(
  'SELECT u.*, json_agg(o.*) as orders FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.email = $1 GROUP BY u.id',
  ['max@example.com']
);
const user = result.rows[0];
```

Das ORM übersetzt deine TypeScript-Anfrage in SQL — du siehst das SQL erst, wenn du nachschaust.

---

## Populäre ORMs für JavaScript/TypeScript

### Prisma — das beliebteste ORM

```typescript
// schema.prisma — dein Datenbankschema als Datei
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  orders    Order[]
  createdAt DateTime @default(now())
}

model Order {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
  total  Float
  status String
}
```

```typescript
// Typensichere Abfragen
const users = await prisma.user.findMany({
  where: {
    orders: {
      some: { status: 'pending' }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
// users ist vollständig typisiert — TypeScript kennt alle Felder
```

**Vorteile:**
- Exzellente TypeScript-Integration (auto-generated types)
- Prisma Studio (GUI für deine Datenbank)
- Einfache Migrationen
- Große Community

**Nachteile:**
- Generiertes SQL ist manchmal suboptimal
- Komplexe Abfragen sind unhandlich
- Migration-Workflow kann hinderlich sein

### Drizzle — das leichtgewichtige Newcomer-ORM

```typescript
// Schema als TypeScript
import { pgTable, uuid, varchar, decimal } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
});

// Typensichere Abfragen — SQL-ähnliche Syntax
const pendingOrderUsers = await db
  .select({ id: users.id, name: users.name })
  .from(users)
  .innerJoin(orders, eq(orders.userId, users.id))
  .where(eq(orders.status, 'pending'))
  .orderBy(desc(users.createdAt))
  .limit(10);
```

**Vorteile:**
- Leichtgewichtig und schnell
- SQL-ähnliche Syntax — leichter zu verstehen
- Kein separater Runtime-Client (direkte Library)
- Funktioniert gut mit Supabase

**Nachteile:**
- Kleinere Community als Prisma
- Weniger "Magie" — mehr manuell

---

## Raw SQL: Direkter Zugriff

```typescript
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Komplexe Abfrage — volle SQL-Power
const result = await pool.query(`
  WITH monthly_revenue AS (
    SELECT
      DATE_TRUNC('month', created_at) as month,
      SUM(total) as revenue,
      COUNT(*) as order_count
    FROM orders
    WHERE status = 'completed'
    GROUP BY DATE_TRUNC('month', created_at)
  )
  SELECT
    month,
    revenue,
    order_count,
    revenue / LAG(revenue) OVER (ORDER BY month) - 1 as growth_rate
  FROM monthly_revenue
  ORDER BY month DESC
  LIMIT 12
`, []);

return result.rows;
```

Das wäre mit einem ORM sehr schwierig oder würde zu schlechtem SQL führen.

---

## Vergleichstabelle

| Kriterium | Prisma | Drizzle | Raw SQL |
|---|---|---|---|
| Lernkurve | Niedrig | Mittel | SQL lernen |
| Typsicherheit | Sehr hoch | Hoch | Manuell |
| Performance | Gut | Sehr gut | Optimal |
| Komplexe Abfragen | Umständlich | Mittel | Einfach |
| Migrations | Eingebaut | Eingebaut | Manuell |
| Serverless | Ja (mit Accelerate) | Sehr gut | Ja |
| Ideal für | Schneller Start | Balance | Volle Kontrolle |

---

## Das hybride Modell — bestes aus beiden Welten

Du musst dich nicht entscheiden! Viele Projekte nutzen ein ORM für einfache CRUD-Operationen und Raw SQL für komplexe Abfragen:

```typescript
// Einfache Operationen → ORM (Prisma)
const user = await prisma.user.create({ data: { email, name } });
const orders = await prisma.order.findMany({ where: { userId: user.id } });

// Komplexe Analytik → Raw SQL
const stats = await prisma.$queryRaw`
  SELECT
    category,
    SUM(total) as revenue,
    AVG(total) as avg_order_value
  FROM orders o
  JOIN products p ON p.id = o.product_id
  WHERE o.created_at > ${startDate}
  GROUP BY category
  ORDER BY revenue DESC
`;
```

Prisma unterstützt `$queryRaw` für direkte SQL-Abfragen — das Beste aus beiden Welten.

---

## Empfehlung nach Projekttyp

### Für Einsteiger und MVPs: Prisma

- Schneller Start
- Keine SQL-Kenntnisse nötig
- Exzellente Dokumentation

### Für Supabase-Projekte: Supabase Client oder Drizzle

```typescript
// Supabase JS Client (kein separates ORM nötig)
const { data, error } = await supabase
  .from('users')
  .select('*, orders(*)')
  .eq('email', 'max@example.com')
  .single();
```

Der Supabase Client hat einen eingebauten ORM-ähnlichen Query Builder.

### Für Performance-kritische Apps: Drizzle + Raw SQL

### Für Teams mit SQL-Expertise: Raw SQL + Query Builder

> [!IMPORTANT]
> **Lerne SQL** — auch wenn du ein ORM verwendest. Das ORM generiert SQL, und wenn etwas langsam ist, musst du das generierte SQL verstehen können. EXPLAIN ANALYZE ist dein Freund.

---

## Wie Venator dir hilft

Venator empfiehlt den passenden Datenbankzugriffs-Ansatz basierend auf deinem Stack. Für Next.js + Supabase empfiehlt Venator den Supabase Client als erste Wahl, mit Prisma oder Drizzle als Optionen für komplexere Anforderungen.

## Weiterführende Artikel

- [Datenbankmigrationen richtig durchführen](/learn/datenbankmigrationen)
- [Datenbankindexierung erklärt](/learn/datenbank-indexierung)
- [Datenbankabfragen optimieren](/learn/datenbankabfragen-optimieren)
