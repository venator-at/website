---
title: "Datenbankmigrationen richtig durchführen"
description: "Datenbankmigrationen verständlich erklärt: Was Migrationen sind, wie du sie mit Prisma oder Flyway durchführst und wie du Zero-Downtime-Deployments erreichst."
category: "Datenbanken"
order: 27
keywords: ["Datenbankmigrationen", "Schema Migration", "Prisma Migrate", "Zero Downtime", "Datenbank-Deployment"]
---

## Was sind Datenbankmigrationen?

Deine App wächst. Plötzlich brauchst du eine neue Spalte in der Nutzertabelle, oder du willst eine Tabelle umbenennen, oder du musst Daten transformieren. Das Problem: Deine Datenbank läuft bereits in Produktion mit echten Daten.

**Datenbankmigrationen** sind versionierte, geordnete Skripte, die dein Datenbankschema kontrolliert und sicher ändern. Statt manuell SQL in der Produktion auszuführen (was zum Disaster führt), hast du eine Versionshistorie aller Schemaänderungen.

---

## Das Problem ohne Migrationen

```bash
# ❌ Der gefährliche Weg — direkt in Produktion
psql production-db -c "ALTER TABLE users ADD COLUMN phone VARCHAR(20);"
# Was, wenn du im falschen Fenster bist?
# Was, wenn der Befehl fehlschlägt?
# Wie machst du es rückgängig?
# Wie weiß dein Kollege, was du gemacht hast?
```

Ohne Migrationen führt das zu:
- Inkonsistenten Datenbankzuständen zwischen Entwicklung und Produktion
- Keine Nachvollziehbarkeit, wer was wann geändert hat
- Kein einfacher Rollback bei Fehler
- Deployment-Chaos im Team

---

## Migrationen mit Prisma

Prisma macht Migrationen besonders einfach:

### 1. Schema ändern

```prisma
// schema.prisma — du änderst das Schema
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  phone     String?  // ← Neu hinzugefügt
  createdAt DateTime @default(now())
}
```

### 2. Migration erstellen

```bash
npx prisma migrate dev --name add_phone_to_users
```

Prisma erstellt automatisch eine Migration-Datei:

```
prisma/
└── migrations/
    ├── 20240101_000000_init/
    │   └── migration.sql
    └── 20240315_143022_add_phone_to_users/
        └── migration.sql  ← neu erstellt
```

Die Migration-Datei enthält:

```sql
-- Migration: add_phone_to_users
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
```

### 3. In Produktion deployen

```bash
npx prisma migrate deploy
```

Prisma führt nur Migrationen aus, die noch nicht ausgeführt wurden. Der Status wird in einer `_prisma_migrations`-Tabelle gespeichert.

---

## Migrationen mit Supabase

Supabase hat einen eingebauten Migration-Workflow:

```bash
# Neue Migration erstellen
supabase migration new add_phone_to_users

# Migration-Datei bearbeiten
# supabase/migrations/20240315143022_add_phone_to_users.sql

# Lokal anwenden
supabase db push

# In Produktion deployen (via Supabase Dashboard oder CLI)
supabase db push --linked
```

Du kannst auch direkt SQL schreiben:

```sql
-- supabase/migrations/20240315143022_add_phone_to_users.sql
ALTER TABLE public.users ADD COLUMN phone TEXT;

-- Index hinzufügen
CREATE INDEX idx_users_phone ON users (phone) WHERE phone IS NOT NULL;

-- RLS-Policy aktualisieren
ALTER POLICY "Users can update own profile" ON users
USING (auth.uid() = id);
```

---

## Destruktive vs. Additive Migrationen

### Additive Migrationen — sicher

```sql
-- Spalte hinzufügen → sicher, App funktioniert noch
ALTER TABLE products ADD COLUMN description TEXT;

-- Neue Tabelle hinzufügen → immer sicher
CREATE TABLE product_reviews (...);

-- Optionale Spalte hinzufügen → sicher
ALTER TABLE users ADD COLUMN avatar_url TEXT;  -- nullable
```

### Destruktive Migrationen — gefährlich!

```sql
-- ❌ Spalte löschen → App crasht, wenn Code auf die Spalte zugreift
ALTER TABLE users DROP COLUMN phone;

-- ❌ Tabelle umbenennen → alle Queries brechen
ALTER TABLE orders RENAME TO customer_orders;

-- ❌ Spaltentyp ändern (kann Datenverlust verursachen)
ALTER TABLE products ALTER COLUMN price TYPE INTEGER;
```

---

## Zero-Downtime-Migrationen

Wenn deine App viel Traffic hat, musst du Migrationen durchführen, **ohne Ausfallzeit**. Das erfordert ein mehrphasiges Vorgehen:

### Beispiel: Spalte umbenennen (username → display_name)

#### Phase 1: Neue Spalte hinzufügen

```sql
-- Migration 1: Neue Spalte hinzufügen
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Bestehende Daten kopieren
UPDATE users SET display_name = username;
```

#### Phase 2: Code auf neue Spalte umstellen

```typescript
// Alter Code
user.username

// Neuer Code — beide Spalten nutzen, bis alle Instanzen aktualisiert
user.display_name ?? user.username
```

Deploy dieser Code-Version, während beide Spalten existieren.

#### Phase 3: Alte Spalte entfernen

Erst wenn **alle** Code-Instanzen die neue Spalte nutzen:

```sql
-- Migration 3: Alte Spalte entfernen
ALTER TABLE users DROP COLUMN username;
```

> [!IMPORTANT]
> Nie Schritt 1 und 3 in derselben Migration kombinieren! Das führt zu Downtime oder Datenverlust.

---

## Rollback — Was, wenn etwas schiefgeht?

### Mit Prisma: Rollback zu vorherigem Zustand

```bash
# Nicht direkt unterstützt — Prisma empfiehlt Forward-Rollbacks
# Erstelle eine neue Migration, die die Änderung rückgängig macht
npx prisma migrate dev --name revert_add_phone
```

### Manuelle Rollback-Migration

```sql
-- migration_revert.sql
-- Rückgängig machen der add_phone-Migration
ALTER TABLE users DROP COLUMN IF EXISTS phone;
```

### Backup vor Migration

```bash
# Immer vor einer riskanten Migration!
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Migrations-Checkliste für Produktions-Deployments

```
Vor der Migration:
☐ Backup der Datenbank erstellt
☐ Migration lokal getestet
☐ Staging-Umgebung getestet
☐ Rollback-Plan definiert

Bei destruktiven Migrationen:
☐ Mehrphasiger Rollout geplant
☐ Monitoring aktiviert
☐ Team informiert

Nach der Migration:
☐ Alle Tabellen/Spalten vorhanden
☐ Daten korrekt migriert
☐ App funktioniert wie erwartet
☐ Performance-Monitoring (neue Queries langsam?)
```

> [!NOTE]
> Supabase bietet in den Plan-Tiers Point-in-Time Recovery — damit kannst du die Datenbank auf jeden Zeitpunkt innerhalb des letzten Tages/Woche zurücksetzen. Ein wichtiges Safety-Net für Produktions-Migrationen.

---

## Wie Venator dir hilft

Wenn du dein Datenbankschema in Venator planst, weist die Plattform darauf hin, welche Schemaänderungen sicher sind und welche Zero-Downtime-Strategien erfordern. Du bekommst konkrete Empfehlungen für deinen gewählten Stack (Prisma, Supabase, etc.).

## Weiterführende Artikel

- [ORM vs Raw SQL: Was solltest du wählen?](/learn/orm-vs-raw-sql)
- [Datenbankindexierung erklärt](/learn/datenbank-indexierung)
- [CI/CD Pipelines erklärt](/learn/cicd-pipelines)
