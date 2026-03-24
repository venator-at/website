---
title: "TypeScript für Einsteiger"
description: "Warum TypeScript, wie du es lernst und welche Patterns dir als Anfänger wirklich helfen."
category: "Architektur-Grundlagen"
order: 4
keywords: "TypeScript, JavaScript, Typisierung, Interfaces, Types, Generics, TypeScript Tutorial, Anfänger"
---

## Warum TypeScript?

Du hast vielleicht JavaScript gelernt und fragst dich: Warum noch TypeScript lernen? Ist das nicht einfach mehr Schreibarbeit?

Kurze Antwort: **Nein. TypeScript spart dir Schreibarbeit – indem es verhindert, dass du stundenlang nach Bugs suchst.**

```ts
// JavaScript: Kein Fehler beim Schreiben, aber kaputt zur Laufzeit
function greet(user) {
  return "Hallo, " + user.firstName; // Was wenn user.firstName nicht existiert?
}

greet({ name: "Max" }); // → "Hallo, undefined" – stiller Bug!

// TypeScript: Fehler sofort in der IDE
function greet(user: { firstName: string }) {
  return "Hallo, " + user.firstName;
}

greet({ name: "Max" }); // ← Rotes Unterstreichen: 'name' existiert nicht in diesem Typ
```

TypeScript findet Fehler **bevor** du die Seite im Browser öffnest.

---

## Die Grundlagen in 10 Minuten

### Primitive Types

```ts
const name: string = "Max";
const age: number = 25;
const isActive: boolean = true;
const nothing: null = null;
const notDefined: undefined = undefined;
```

In der Praxis brauchst du diese Annotationen oft gar nicht – TypeScript erkennt den Typ automatisch (Type Inference):

```ts
const name = "Max";       // TypeScript weiß: string
const age = 25;           // TypeScript weiß: number
const isActive = true;    // TypeScript weiß: boolean
```

---

### Interfaces und Types

Das sind die wichtigsten Werkzeuge. Damit beschreibst du, wie ein Objekt aussehen soll:

```ts
// Interface (für Objekte und Klassen)
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;  // ← Das ? bedeutet: optional
}

// Type Alias (flexibler, für Unions und mehr)
type ProjectStatus = "draft" | "active" | "archived";

type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  owner: User;
};
```

**Interface vs. Type?** In der Praxis ist der Unterschied klein. Als Faustregel: `interface` für Objekte, `type` für Unions und primitive Aliases.

---

### Arrays und generische Types

```ts
// Array-Schreibweise
const names: string[] = ["Max", "Maria"];
const projects: Project[] = [];

// Generics: Platzhaltervariablen für Typen
function getFirst<T>(items: T[]): T {
  return items[0];
}

const firstString = getFirst(["a", "b", "c"]); // T = string
const firstNumber = getFirst([1, 2, 3]);         // T = number
```

---

### Union Types: "Entweder-oder"

```ts
// Status kann nur einer dieser Werte sein
type Status = "loading" | "success" | "error";

function showStatus(status: Status) {
  if (status === "loading") return <Spinner />;
  if (status === "success") return <SuccessIcon />;
  return <ErrorIcon />;
}
```

---

## Praktische Patterns für Next.js

### API Response typisieren

```ts
// types/project.ts
export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

// In einem Server Component:
async function getProject(id: string): Promise<Project | null> {
  const response = await fetch(`/api/projects/${id}`);
  if (!response.ok) return null;
  return response.json() as Project;
}
```

### Props typisieren

```tsx
// components/ProjectCard.tsx
interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;  // Optional: macht die Karte auch ohne Delete-Funktion nutzbar
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <div>
      <h3>{project.title}</h3>
      {onDelete && (
        <button onClick={() => onDelete(project.id)}>Löschen</button>
      )}
    </div>
  );
}
```

### Event Handler typisieren

```tsx
// React Events haben eigene Types:
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
}

function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setValue(e.target.value);
}

function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  // ...
}
```

---

## Die häufigsten Fehler und wie du sie behebst

### `any` nicht nutzen

```ts
// ❌ Falsch: 'any' macht TypeScript wertlos
function processData(data: any) {
  return data.value; // Kein Fehler, auch wenn data.value nicht existiert
}

// ✅ Richtig: Echten Typ definieren
function processData(data: { value: string }) {
  return data.value;
}

// ✅ Wenn Typ wirklich unbekannt: 'unknown' statt 'any'
function processData(data: unknown) {
  if (typeof data === "object" && data && "value" in data) {
    return (data as { value: string }).value;
  }
}
```

### Non-null Assertion vermeiden

```ts
const user = getUser(); // Gibt User | null zurück

// ❌ Falsch: ! sagt TypeScript "Vertrau mir, ist nicht null"
console.log(user!.name); // Crash wenn user null ist

// ✅ Richtig: Erst prüfen
if (user) {
  console.log(user.name);
}
```

> [!TIP]
> TypeScript im `strict`-Modus (wie in Venator) verbietet viele dieser schlechten Patterns automatisch. Aktiviere strict mode in `tsconfig.json`: `"strict": true`.

---

## Zod: TypeScript zur Laufzeit

TypeScript prüft nur während der Entwicklung. Wenn Daten von einer API kommen, weiß TypeScript zur Laufzeit nicht, ob sie dem Typ entsprechen.

**Zod** löst das:

```ts
import { z } from "zod";

const ProjectSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  status: z.enum(["draft", "active", "archived"]),
});

type Project = z.infer<typeof ProjectSchema>; // Typ automatisch generieren

// API-Response validieren:
const raw = await response.json();
const project = ProjectSchema.parse(raw); // Wirft Fehler wenn ungültig
```

Venator nutzt Zod für alle externen Daten – ein Pattern, das du von Anfang an übernehmen solltest.
