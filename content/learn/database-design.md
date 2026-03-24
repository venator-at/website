---
title: "Datenbankdesign für Anfänger"
description: "Schema-Design, Normalisierung, Indexes und häufige Fehler beim Datenbankaufbau."
category: "Datenbanken"
order: 4
keywords: "Datenbankdesign, Schema, PostgreSQL, Normalisierung, Indexes, Foreign Keys, SQL, Supabase"
---

## Das Schema: Der Bauplan deiner Daten

Ein **Datenbankschema** legt fest, welche Tabellen es gibt, welche Spalten sie haben und wie sie miteinander verbunden sind. Es ist wie ein Bauplan – eine schlechte Planung am Anfang bedeutet aufwändige Umbauten später.

Der häufigste Fehler: Alles in eine Tabelle stopfen, weil es "einfacher" scheint.

```sql
-- ❌ Schlechtes Design: Alles in einer Spalte
CREATE TABLE users (
  id         UUID PRIMARY KEY,
  name       TEXT,
  projects   TEXT  -- "Projekt1,Projekt2,Projekt3" (kommasepariert!)
);

-- ✅ Gutes Design: Eigene Tabelle für Projekte
CREATE TABLE users (
  id   UUID PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE projects (
  id      UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title   TEXT NOT NULL
);
```

---

## Beziehungen zwischen Tabellen

### 1:N – Ein Nutzer, viele Projekte

Das ist die häufigste Beziehung. Ein Nutzer hat mehrere Projekte, aber jedes Projekt gehört nur einem Nutzer.

```sql
-- 'user_id' in projects ist der Fremdschlüssel
projects.user_id → users.id
```

### N:M – Viele Nutzer, viele Projekte (Teams)

Ein Projekt kann mehreren Nutzern gehören, und ein Nutzer kann in mehreren Projekten sein. Dafür brauchst du eine **Verbindungstabelle**:

```sql
CREATE TABLE project_members (
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT DEFAULT 'viewer',  -- 'owner' | 'editor' | 'viewer'
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)  -- Kombination muss eindeutig sein
);
```

### 1:1 – Nutzer und Profil

Manchmal möchtest du Daten trennen, die logisch zusammengehören, aber unterschiedlich oft abgerufen werden:

```sql
-- Oft gebraucht (beim Login)
CREATE TABLE users (
  id    UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);

-- Nur manchmal gebraucht (auf der Profilseite)
CREATE TABLE user_profiles (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio        TEXT,
  website    TEXT,
  avatar_url TEXT
);
```

---

## Normalisierung: Redundanz vermeiden

**Normalisierung** bedeutet, Daten so zu strukturieren, dass jede Information nur an einem Ort gespeichert ist.

```sql
-- ❌ Schlecht: Email steht in jeder Zeile
CREATE TABLE orders (
  id           UUID PRIMARY KEY,
  user_email   TEXT,  -- Dupliziert in jeder Bestellung!
  user_name    TEXT,
  product      TEXT
);

-- ✅ Gut: Email nur einmal in users
CREATE TABLE orders (
  id      UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- Referenz, nicht Kopie
  product TEXT
);
```

Wenn du die Email eines Nutzers änderst, musst du sie nur an einem Ort ändern – nicht in jeder einzelnen Bestellung.

---

## Indexes: Schnelle Suche in großen Tabellen

Stell dir vor, du suchst in einem Buch ohne Inhaltsverzeichnis. Du musst jede Seite durchlesen. Ein **Index** ist das Inhaltsverzeichnis deiner Datenbank.

```sql
-- Ohne Index: Die Datenbank liest ALLE Zeilen
SELECT * FROM projects WHERE user_id = 'abc';

-- Mit Index: Direkt zur richtigen Stelle springen
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Multi-Column Index für kombinierte Suchen
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
```

**Wann Index erstellen?**
- Auf allen Foreign Keys (`user_id`, `org_id`, etc.)
- Auf Spalten, die du häufig in `WHERE` nutzt
- Auf Spalten, nach denen du sortierst (`ORDER BY`)

> [!IMPORTANT]
> **Nicht alles indexieren!** Indexes beschleunigen Lesevorgänge, aber verlangsamen Schreibvorgänge (der Index muss aktualisiert werden). Als Faustregel: Erstelle zuerst keine Indexes, und füge sie hinzu, wenn du Performance-Probleme hast.

---

## Praktisches Beispiel: Ein vollständiges Schema

```sql
-- UUID-Extension aktivieren (Supabase macht das automatisch)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Nutzer (wird von Supabase Auth verwaltet)
-- auth.users existiert automatisch

-- Profile (1:1 mit auth.users)
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name    TEXT,
  avatar_url   TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Projekte
CREATE TABLE projects (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL CHECK (char_length(title) > 0),
  description      TEXT,
  status           TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index für häufige Abfragen
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutzer sehen nur eigene Projekte"
ON projects FOR ALL
USING (auth.uid() = user_id);
```

---

## Häufige Fehler und wie du sie vermeidest

| Fehler | Problem | Lösung |
|---|---|---|
| Daten als String speichern (`"tag1,tag2"`) | Nicht filterbar, nicht erweiterbar | Eigene Tabelle oder Array-Typ |
| Kein `created_at` | Kann Erstelldatum nie mehr nachverfolgen | Immer `DEFAULT NOW()` |
| Kein `ON DELETE CASCADE` | Orphan-Daten häufen sich an | Kaskadierendes Löschen definieren |
| Passwörter im Klartext | Katastrophales Sicherheitsproblem | Auth-Dienst nutzen (Supabase, Clerk) |
| Zu frühe Optimierung | Überkomplexes Schema von Beginn an | Einfach starten, bei Bedarf erweitern |

> [!TIP]
> **Supabase Table Editor** ist großartig zum Visualisieren deines Schemas. Du kannst dort auch Tabellen erstellen und Beziehungen als Diagramm sehen – ohne SQL zu schreiben.
