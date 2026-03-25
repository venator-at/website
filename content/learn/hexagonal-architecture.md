---
title: "Hexagonal Architecture für Einsteiger"
description: "Hexagonal Architecture (Ports & Adapters) einfach erklärt: Warum du deine Geschäftslogik von Datenbanken und Frameworks entkoppeln solltest."
category: "Architektur-Grundlagen"
order: 15
keywords: ["Hexagonal Architecture", "Ports and Adapters", "Clean Architecture", "Softwarearchitektur", "Entkopplung"]
---

## Was ist Hexagonal Architecture?

Hast du jemals eine App gebaut, bei der ein Datenbank-Wechsel alles kaputt gemacht hat? Oder bei der du keinen Test schreiben konntest, ohne eine echte Datenbank zu haben? Genau diese Probleme löst die **Hexagonal Architecture**.

Die Idee stammt von Alistair Cockburn und wird auch **Ports and Adapters** genannt. Das Ziel: Deine **Geschäftslogik** (was deine App *tut*) ist vollständig unabhängig von technischen Details wie Datenbanken, HTTP-Frameworks oder externen APIs.

---

## Das Hexagon — visualisiert

```
          ┌─────────────────────────┐
          │                         │
  REST    │    ┌─────────────┐      │  Datenbank
  API ────┼───►│             │◄─────┼──(Adapter)
 (Adapter)│    │  Deine      │      │
          │    │  Geschäfts- │      │  Externe
  CLI ────┼───►│  logik      │◄─────┼── API
 (Adapter)│    │  (Kern)     │      │  (Adapter)
          │    │             │      │
  Tests ──┼───►│             │      │
 (Adapter)│    └─────────────┘      │
          │                         │
          └─────────────────────────┘
```

Der **Kern** (das Hexagon) kennt keine Datenbanken, kein HTTP, kein Framework. Er kennt nur **Ports** — das sind Interfaces, die beschreiben, *was* der Kern braucht.

**Adapter** implementieren diese Interfaces und verbinden den Kern mit der Außenwelt.

---

## Ports und Adapters verstehen

### Port — das Interface

Ein Port beschreibt eine Fähigkeit, die der Kern benötigt:

```typescript
// Port: Was der Kern von einer Nutzerverwaltung erwartet
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}
```

Der Kern weiß nicht, ob dahinter eine PostgreSQL-Datenbank, eine In-Memory-Liste oder eine externe API steckt.

### Adapter — die Implementierung

Ein Adapter implementiert den Port für eine konkrete Technologie:

```typescript
// PostgreSQL-Adapter
class PostgresUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return row ? mapToUser(row) : null;
  }

  async save(user: User): Promise<void> {
    await db.query(
      'INSERT INTO users (id, email, name) VALUES ($1, $2, $3)',
      [user.id, user.email, user.name]
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return row ? mapToUser(row) : null;
  }
}
```

Für Tests kannst du einen einfachen In-Memory-Adapter erstellen:

```typescript
// Test-Adapter — kein echte Datenbank nötig!
class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string) { return this.users.get(id) ?? null; }
  async save(user: User) { this.users.set(user.id, user); }
  async findByEmail(email: string) {
    return [...this.users.values()].find(u => u.email === email) ?? null;
  }
}
```

---

## Der Kern — reine Geschäftslogik

```typescript
// Geschäftslogik: Nutzer registrieren
class UserService {
  constructor(
    private userRepository: UserRepository,  // Port, nicht Implementierung!
    private emailService: EmailService,       // Port
  ) {}

  async registerUser(email: string, name: string): Promise<User> {
    // Reine Logik — keine Datenbank, kein HTTP
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error('E-Mail bereits vergeben');
    }

    const user = new User({ id: generateId(), email, name });
    await this.userRepository.save(user);
    await this.emailService.sendWelcome(user.email, user.name);

    return user;
  }
}
```

---

## Primäre vs. Sekundäre Adapter

Es gibt zwei Arten von Adaptern:

**Primäre Adapter** (treiben den Kern an):
- REST API Controller
- CLI-Interface
- GraphQL Resolver
- Test-Suite

**Sekundäre Adapter** (werden vom Kern angetrieben):
- Datenbank-Implementierungen
- E-Mail-Services
- externe API-Clients
- Message Queue Producer

---

## Die Vorteile

### 1. Testbarkeit
Du kannst deinen gesamten Kern mit In-Memory-Adaptern testen — blitzschnell, ohne Datenbankverbindung.

### 2. Austauschbarkeit
Du willst von PostgreSQL zu MongoDB wechseln? Schreib einen neuen Adapter. Der Kern bleibt unberührt.

### 3. Unabhängigkeit vom Framework
Dein Geschäftslogik-Code enthält kein Express, kein Next.js, kein Prisma. Wenn du das Framework wechselst, bleibt alles andere stehen.

> [!IMPORTANT]
> Hexagonal Architecture ist nicht für kleine CRUD-Apps gedacht. Bei einem Projekt mit 5 Endpunkten ist es Overkill. Es lohnt sich ab mittlerer Komplexität und wenn die Langlebigkeit des Codes wichtig ist.

---

## Vergleich mit Clean Architecture

| Konzept | Hexagonal | Clean Architecture |
|---|---|---|
| Ursprung | Alistair Cockburn | Robert C. Martin |
| Metapher | Hexagon + Ports | Schalen/Ringe |
| Kernidee | Ports & Adapters | Dependency Rule |
| Komplexität | Mittel | Hoch |
| Überlappung | Hoch | Hoch |

Die Konzepte sind sehr ähnlich — Clean Architecture ist eine Erweiterung desselben Grundgedankens.

---

## Wie Venator dir hilft

Für Projekte mit mittlerer bis hoher Komplexität empfiehlt Venator Hexagonal Architecture und zeigt im Architektur-Graph, wo Ports definiert werden sollten. Du siehst auf einen Blick, welche Teile deines Systems von welchen Technologien abhängen — und wo du Entkopplung gewinnst.

## Weiterführende Artikel

- [Clean Architecture: Prinzipien einfach erklärt](/learn/clean-architecture)
- [Domain-Driven Design Grundlagen](/learn/domain-driven-design)
- [ORM vs Raw SQL: Was solltest du wählen?](/learn/orm-vs-raw-sql)
