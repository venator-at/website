---
title: "Die Anatomie einer API"
description: "Wie Frontends und Backends miteinander sprechen: REST, GraphQL und Co. einfach erklärt."
category: "Architektur-Grundlagen"
order: 2
---

## Was ist eine API?

Eine **API** (Application Programming Interface) ist der "Kellner" in einem Restaurant.
Du (das Frontend) sitzt am Tisch, liest die Karte und bestellst ein Essen. Du gehst nicht selbst in die Küche (Datenbank), um dir das Steak zu braten. Du sagst dem Kellner (API), was du willst. Der Kellner geht in die Küche, kommt mit dem Essen zurück und serviert es dir.

Wenn dein Browser Daten (z.B. eine Liste von Benutzern) anzeigen soll, sendet er eine Anfrage (Request) an eine API. Diese API holt die Daten (z.B. aus der Datenbank) und sendet sie im richtigen Format (meist JSON) zurück.

## REST (Representational State Transfer)

**REST** ist der absolute Standard im Netz. Es basiert auf einfachen URLs und "Methoden".

*   `GET /users` -> Kellner, bring mir eine Liste aller Nutzer.
*   `POST /users` -> Kellner, hier sind Daten, erstelle einen neuen Nutzer.
*   `DELETE /users/123` -> Kellner, lösche Nutzer 123.

**Vorteile für Anfänger:** Extrem simpel. Jeder versteht REST, und du kannst es sogar direkt in deinem Browser testen (jeder Link, den du im Browser öffnest, ist ein GET-Request).

## GraphQL

**GraphQL** (entwickelt von Facebook) ist wie ein Buffet, bei dem du genau angeben kannst, was auf deinem Teller landen soll.

Bei REST kriegst du oft zu viele Daten (z.B. das Profilbild, auch wenn du nur den Vornamen brauchst). Bei GraphQL sendest du eine spezifische Anfrage: *"Gib mir Nutzer 123, aber ich will NUR den Vornamen und die E-Mail."*

**Vorteile für Anfänger:** Schwerer aufzusetzen, aber wenn du Tools wie Hasura oder den Supabase GraphQL-Endpoint nutzt, extrem mächtig für komplexe Datenstrukturen im Frontend.

## RPC (Remote Procedure Call) & tRPC

Bei **RPC** rufst du einfach eine Funktion auf, die auf dem Server liegt, als wäre sie auf deinem eigenen Computer.
Mit **tRPC** (in der Welt von TypeScript) hast du sogar die Garantie, dass du keine Tippfehler bei den Endpunkten machst, weil dein Code-Editor dir direkt sagt, welche Funktionen das Backend anbietet.

---

> [!TIP]
> **Was solltest du wählen?**
> Die gute Nachricht: Wenn du z.B. Next.js mit sogenannten *Server Actions* benutzt, musst du manuell gar keine typische REST-API mehr bauen. Ansonsten ist REST der sicherste Startpunkt für 95% aller Projekte.
