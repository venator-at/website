---
title: "State Management in React"
description: "useState, Context, Zustand oder Redux – wann du was brauchst und warum weniger oft mehr ist."
category: "Frontend-Architektur"
order: 9
keywords: "State Management, React, useState, Context API, Zustand, Redux, React Query, TanStack Query"
---

## Was ist „State"?

**State** (Zustand) ist jede Information, die sich in deiner App verändern kann und bei deren Änderung sich die UI aktualisieren soll.

```tsx
// Das ist State: value ändert sich, UI soll reagieren
const [count, setCount] = useState(0);
const [isLoading, setIsLoading] = useState(false);
const [user, setUser] = useState<User | null>(null);
```

Die wichtigste Entscheidung beim State Management ist nicht "welche Library", sondern: **Wo lebt dieser State?**

---

## Ebene 1: Lokaler State mit useState

Für alles, was nur **eine einzige Komponente** betrifft:

```tsx
function SearchInput() {
  const [query, setQuery] = useState("");

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Suchen..."
    />
  );
}
```

`useState` ist fast immer die richtige Antwort. Greife erst zu komplexeren Tools, wenn `useState` wirklich nicht mehr reicht.

---

## Ebene 2: State zwischen Komponenten teilen

Wenn zwei Komponenten denselben State brauchen, **hebe ihn hoch** (State Lifting):

```tsx
// ❌ Problem: SearchInput und SearchResults brauchen beide 'query'
// Aber sie sind Geschwister – weder kann den State des anderen lesen.

// ✅ Lösung: State in den gemeinsamen Parent heben
function SearchPage() {
  const [query, setQuery] = useState(""); // ← State im Parent

  return (
    <>
      <SearchInput query={query} onChange={setQuery} />
      <SearchResults query={query} />
    </>
  );
}
```

Das funktioniert gut bis zu einer Tiefe von 2-3 Ebenen. Danach wird es unhandlich.

---

## Ebene 3: Context API – State überall zugänglich

Wenn State durch viele Ebenen von Komponenten weitergereicht werden muss, hilft **React Context**:

```tsx
// auth-context.tsx
const AuthContext = createContext<{ user: User | null }>({ user: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);

  // ... Firebase Auth listener etc.

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

// In einer tief verschachtelten Komponente:
function UserAvatar() {
  const { user } = useContext(AuthContext); // Direkt zugreifen, kein Props-Drilling
  return <img src={user?.photoURL} />;
}
```

> [!IMPORTANT]
> **Context ist kein State Management Tool für Performance-kritischen State.** Jedes Mal, wenn sich der Context-Wert ändert, werden *alle* Komponenten, die den Context nutzen, neu gerendert. Für State, der sich sehr oft ändert (z.B. Cursor-Position), ist Context ungeeignet.

---

## Ebene 4: Externe Libraries – Zustand & Redux

### Zustand (empfohlen für die meisten Projekte)

```bash
npm install zustand
```

```tsx
import { create } from "zustand";

const useStore = create<{
  count: number;
  increment: () => void;
}>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// In jeder Komponente, ohne Provider:
function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>{count}</button>;
}
```

Zustand ist minimalistisch, schnell und braucht keinen Provider. Die beste Wahl für die meisten Apps.

### Redux Toolkit (für sehr komplexe Apps)

Redux war jahrelang der Standard, ist aber für neue Projekte oft überdimensioniert. Redux Toolkit (RTK) vereinfacht Redux enorm:

```ts
import { createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    incremented: (state) => { state.value += 1; },
  },
});
```

> [!TIP]
> Als Faustregel: **< 5 globale State-Variablen → Context. 5-20 → Zustand. 20+ komplexe States mit vielen Aktionen → Redux Toolkit.**

---

## Server State: React Query / TanStack Query

Das ist der häufigste Denkfehler: **Daten von einer API sind kein lokaler State.** Sie haben eigene Anforderungen: Caching, Hintergrund-Revalidierung, Error-Handling, Loading-States.

Genau dafür gibt es **TanStack Query**:

```tsx
import { useQuery } from "@tanstack/react-query";

function ProjectList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetch("/api/projects").then(r => r.json()),
    staleTime: 1000 * 60 * 5, // 5 Minuten cachen
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;

  return data.map(p => <ProjectCard key={p.id} project={p} />);
}
```

Du bekommst automatisch:
- **Loading States** während des Ladens
- **Error Handling** wenn der Request fehlschlägt
- **Caching** – dieselbe Query wird nur einmal gefeuert
- **Hintergrund-Revalidierung** wenn der Fokus zurückkommt

---

## Die Entscheidungshilfe

```
Welcher State ist es?

├── Nur eine Komponente betroffen?
│   └── → useState

├── Einige Geschwister-Komponenten betroffen?
│   └── → State Lifting (useState im Parent)

├── Viele Ebenen tief (Theming, Auth, Sprache)?
│   └── → Context API

├── Komplexer globaler App-State?
│   └── → Zustand

├── Daten von einer API?
│   └── → TanStack Query

└── Extrem komplexe App mit 10+ Entwicklern?
    └── → Redux Toolkit
```
