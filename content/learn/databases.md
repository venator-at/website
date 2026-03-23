---
title: "Datenbanken im Detail"
description: "SQL vs. NoSQL und warum ORMs dein Leben einfacher machen."
category: "Datenbanken"
order: 3
---

## Relational (SQL) vs. Dokumentenbasiert (NoSQL)

Wenn du im Venator-Wizard nach einer Datenbank suchst, stehst du oft vor der Wahl: Supabase (PostgreSQL) oder Firebase (Firestore)? Das ist oft die Wahl zwischen SQL und NoSQL.

### SQL (Relational)
Denke an **Excel**. Du hast feste Tabellen, feste Spalten und Zeilen. 
*   Tabelle: `users` (Spalten: id, name, email)
*   Tabelle: `posts` (Spalten: id, title, user_id)

Diese Tabellen können in Beziehung gesetzt werden -> Die `user_id` im Post "referenziert" eine ID in der Nutzer-Tabelle. Deshalb heißt es *relational*.
**Beispiele:** PostgreSQL, MySQL, SQLite.

### NoSQL (Dokumentenbasiert)
Denke an **Aktenschränke mit Ordnern**. Du hast einen Ordner für einen Nutzer, und in diesem Ordner stecken Zettel mit beliebigen Texten (Dokumente im JSON-Format). Wenn ein Post zum Nutzer gehört, stopfst du den Zettel oft einfach direkt in den Nutzer-Ordner.
**Beispiele:** MongoDB, Firebase Firestore.

## Was ist ein ORM?

Ein **ORM** (Object-Relational Mapper) ist ein Übersetzer. 
Normale SQL-Datenbanken wollen, dass du Befehle wie `SELECT * FROM users WHERE age > 18;` schreibst.
Wenn du im Code bist, willst du aber lieber etwas wie `db.users.find({ age: { gt: 18 } })` schreiben.

Das ORM übernimmt diesen Job. Es übersetzt den Programm-Code in SQL.

Bekannte ORMs für Node.js / TypeScript:
*   **Prisma:** Geniale Entwickler-Erfahrung. Du definierst dein Schema und Prisma generiert dir perfekten Code.
*   **Drizzle:** Leichter und näher am echten SQL, aktuell der Liebling der Szene.

> [!NOTE]
> Wenn du **Supabase** nutzt, brauchst du oft gar kein klassisches ORM! Supabase generiert dir direkt eine API (und einen Typescript-Client), so dass du ganz ohne Backend direkt aus dem Frontend auf die Datenbank zugreifen kannst, und das sicher über RLS (Row Level Security).
