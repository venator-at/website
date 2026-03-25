---
title: "REST vs GraphQL vs tRPC: Was passt zu deinem Projekt?"
description: "REST, GraphQL oder tRPC? Vergleich der drei populärsten API-Stile mit konkreten Empfehlungen für Anfänger und Junior-Entwickler."
category: "Architektur-Grundlagen"
order: 12
keywords: ["REST API", "GraphQL", "tRPC", "API-Design", "API-Architektur"]
---

## REST, GraphQL oder tRPC — welche API brauchst du?

Wenn du eine App baust, die ein Frontend und ein Backend hat, brauchen die beiden eine gemeinsame Sprache. Diese Sprache nennt man eine **API** (Application Programming Interface). Die drei beliebtesten Stile dafür sind REST, GraphQL und tRPC — und jeder hat andere Stärken.

In diesem Artikel lernst du, wann du welchen Ansatz wählen solltest, ohne dich in Theorie zu verlieren.

---

## REST — der Klassiker

**REST** (Representational State Transfer) ist der älteste und am weitesten verbreitete API-Stil. Du definierst **Endpunkte** (URLs), die Ressourcen repräsentieren:

```
GET    /api/users          → alle Nutzer abrufen
GET    /api/users/42       → Nutzer mit ID 42 abrufen
POST   /api/users          → neuen Nutzer erstellen
PUT    /api/users/42       → Nutzer 42 aktualisieren
DELETE /api/users/42       → Nutzer 42 löschen
```

### Wann REST wählen?

- Du baust eine **öffentliche API**, die andere Entwickler nutzen sollen
- Dein Team hat REST-Erfahrung
- Du brauchst einfache HTTP-Caching-Mechanismen
- Dein Projekt ist einfach genug, dass fixe Endpunkte reichen

### REST-Nachteile

- **Over-fetching**: Du bekommst oft mehr Daten als du brauchst
- **Under-fetching**: Manchmal musst du mehrere Anfragen stellen, um alles zu bekommen
- Endpunkte müssen für jede neue Daten-Kombination explizit definiert werden

---

## GraphQL — flexibel aber komplex

**GraphQL** dreht das Konzept um: Es gibt **einen einzigen Endpunkt**, und der Client bestimmt selbst, welche Daten er haben möchte.

```graphql
query {
  user(id: "42") {
    name
    email
    posts {
      title
      createdAt
    }
  }
}
```

Du fragst genau die Felder an, die du brauchst — nicht mehr, nicht weniger.

### Wann GraphQL wählen?

- Du hast komplexe, **verschachtelte Datenstrukturen** (z. B. ein Social Network)
- Mehrere verschiedene **Clients** (Mobile App, Web App) brauchen unterschiedliche Datenmengen
- Dein Team ist bereit, in das GraphQL-Ökosystem zu investieren

### GraphQL-Nachteile

- Steile Lernkurve für Anfänger
- Caching ist komplizierter als bei REST
- Mehr Setup-Aufwand (Schema definieren, Resolver schreiben)

> [!NOTE]
> GraphQL lohnt sich erst ab einer bestimmten Komplexität. Für die meisten Starter-Projekte ist es überdimensioniert.

---

## tRPC — typsicher von Backend zu Frontend

**tRPC** ist ein moderner Ansatz, der speziell für **Full-Stack TypeScript**-Projekte gemacht wurde. Die Idee: Du definierst deine API-Funktionen einmal im Backend — und kannst sie im Frontend **typsicher** aufrufen, als wären es normale Funktionen.

```typescript
// Backend (server.ts)
const appRouter = router({
  getUserById: publicProcedure
    .input(z.string())
    .query(({ input }) => {
      return db.users.find(u => u.id === input);
    }),
});

// Frontend — vollständig typisiert!
const user = await trpc.getUserById.query("42");
```

Kein manuelles Schema, keine Codegenerierung — TypeScript übernimmt alles automatisch.

### Wann tRPC wählen?

- Du verwendest **Next.js oder ein anderes Full-Stack-Framework** mit TypeScript
- Dein Frontend und Backend leben im **selben Repository**
- Du willst maximale Typsicherheit ohne extra Aufwand

### tRPC-Nachteile

- Funktioniert **nur** mit TypeScript/JavaScript
- Nicht geeignet für öffentliche APIs (die andere Sprachen nutzen)
- Weniger verbreitet, kleinere Community

---

## Der direkte Vergleich

| Kriterium | REST | GraphQL | tRPC |
|---|---|---|---|
| Einstiegshürde | Niedrig | Hoch | Mittel |
| Typsicherheit | Manuell | Codegen | Automatisch |
| Flexibilität | Mittel | Hoch | Mittel |
| Öffentliche API | Ja | Ja | Nein |
| Full-Stack TS | Gut | Gut | Ideal |
| Caching | Einfach | Komplex | Einfach |
| Community | Riesig | Groß | Wachsend |

---

## Empfehlung für Einsteiger

- **Erstes Projekt / MVP**: REST — du kannst nichts falsch machen
- **Next.js Full-Stack App**: tRPC — spart enorm viel Zeit und verhindert Bugs
- **Komplexe App mit vielen Daten-Beziehungen**: GraphQL — aber erst wenn du die Grundlagen kennst

> [!IMPORTANT]
> Die "beste" API ist die, die dein Team versteht und produktiv einsetzt. Starte einfach — du kannst später immer wechseln.

---

## Wie Venator dir hilft

Venator analysiert dein Projekt und empfiehlt automatisch den passenden API-Stil. Wenn du z. B. eine öffentliche SaaS-API baust, schlägt Venator REST vor. Bei einem Full-Stack Next.js-Projekt mit TypeScript erscheint tRPC ganz oben in der Empfehlungsliste — inklusive Begründung und Links zur offiziellen Dokumentation.

Du siehst außerdem im Architektur-Graph, wie dein API-Layer mit Frontend und Backend verbunden ist.

## Weiterführende Artikel

- [API Design Grundlagen](/learn/api-design)
- [API Gateway Pattern: Wann und warum?](/learn/api-gateway-pattern)
- [Backend for Frontend (BFF) Pattern erklärt](/learn/bff-pattern)
