---
title: "Clean Architecture: Prinzipien einfach erklärt"
description: "Clean Architecture von Robert C. Martin einfach erklärt: Die Dependency Rule, Schichten und warum dein Code langlebiger wird, wenn du Abhängigkeiten richtig ausrichtest."
category: "Architektur-Grundlagen"
order: 20
keywords: ["Clean Architecture", "Uncle Bob", "Dependency Rule", "Softwarearchitektur", "SOLID"]
---

## Was ist Clean Architecture?

**Clean Architecture** ist ein Architekturmodell von Robert C. Martin (bekannt als "Uncle Bob"). Die zentrale Idee: Dein Code soll so strukturiert sein, dass er **langlebig, testbar und unabhängig** von externen Details ist.

Externe Details sind Dinge wie:
- Das verwendete Web-Framework (Express, Next.js, FastAPI)
- Die Datenbank (PostgreSQL, MongoDB, SQLite)
- externe APIs und Services

Diese Dinge ändern sich. Deine Geschäftslogik sollte davon unberührt bleiben.

---

## Das Schichtmodell

Clean Architecture stellt man sich als **konzentrische Kreise** vor:

```
┌─────────────────────────────────────────────┐
│           Frameworks & Drivers              │
│   ┌─────────────────────────────────────┐   │
│   │         Interface Adapters          │   │
│   │   ┌───────────────────────────┐     │   │
│   │   │      Application Business │     │   │
│   │   │           Rules           │     │   │
│   │   │   ┌───────────────────┐   │     │   │
│   │   │   │  Enterprise       │   │     │   │
│   │   │   │  Business Rules   │   │     │   │
│   │   │   │  (Entities)       │   │     │   │
│   │   │   └───────────────────┘   │     │   │
│   │   └───────────────────────────┘     │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Die vier Schichten

#### 1. Entities (Innenstes)
Die **Kerngeschäftsregeln** — das, was sich am seltensten ändert.

```typescript
// Entity: Reine Geschäftslogik, keine externe Abhängigkeit
class Order {
  private items: OrderItem[] = [];

  addItem(item: OrderItem): void {
    if (this.status !== 'draft') {
      throw new Error('Nur Entwürfe können bearbeitet werden');
    }
    this.items.push(item);
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

Diese Klasse importiert nichts — kein Framework, keine Datenbank. Sie ist die stabilste Schicht.

#### 2. Use Cases (Application Business Rules)
Die **Anwendungsfälle** — was deine App konkret tut.

```typescript
// Use Case: Bestellung aufgeben
class PlaceOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,  // Interface, nicht Implementierung
    private paymentService: PaymentService,     // Interface
    private emailService: EmailService,         // Interface
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderOutput> {
    const order = new Order(input.customerId);

    for (const item of input.items) {
      order.addItem(new OrderItem(item.productId, item.quantity, item.price));
    }

    const payment = await this.paymentService.charge(order.total, input.paymentMethod);
    order.confirmPayment(payment.transactionId);

    await this.orderRepository.save(order);
    await this.emailService.sendOrderConfirmation(order);

    return { orderId: order.id, total: order.total };
  }
}
```

#### 3. Interface Adapters
Konvertiert Daten zwischen der Format der Use Cases und dem Format der Außenwelt (API, DB).

```typescript
// Controller: Übersetzt HTTP → Use Case
class OrderController {
  constructor(private placeOrderUseCase: PlaceOrderUseCase) {}

  async handlePost(req: Request): Promise<Response> {
    // HTTP-Daten → Use Case Input
    const input: PlaceOrderInput = {
      customerId: req.user.id,
      items: req.body.items,
      paymentMethod: req.body.paymentMethod,
    };

    const output = await this.placeOrderUseCase.execute(input);

    // Use Case Output → HTTP Response
    return Response.json({ orderId: output.orderId }, { status: 201 });
  }
}
```

#### 4. Frameworks & Drivers (Äußerstes)
Express, Prisma, PostgreSQL, Stripe — alles Externe. Diese Schicht ändert sich am häufigsten.

```typescript
// Framework-Schicht: Express-Setup
const app = express();
const orderRepo = new PostgresOrderRepository(db);
const paymentService = new StripePaymentService(stripeClient);
const emailService = new ResendEmailService(resendClient);
const placeOrderUseCase = new PlaceOrderUseCase(orderRepo, paymentService, emailService);
const orderController = new OrderController(placeOrderUseCase);

app.post('/api/orders', (req, res) => orderController.handlePost(req, res));
```

---

## Die Dependency Rule — die wichtigste Regel

> **Abhängigkeiten zeigen immer nach innen, nie nach außen.**

- Entities kennen keine Use Cases
- Use Cases kennen keine Controller
- Controller kennen keine Frameworks direkt

Die äußeren Schichten dürfen die inneren kennen — aber nie umgekehrt.

```
❌ FALSCH:
Entity importiert Prisma (Datenbankschicht)

✅ RICHTIG:
Prisma-Repository implementiert ein Interface aus der Entity/Use-Case-Schicht
```

---

## Was du in der Praxis gewinnst

### Testbarkeit
```typescript
// Use Case testen — ohne echte Datenbank, ohne echte Zahlung
const mockOrderRepo = { save: jest.fn() };
const mockPayment = { charge: jest.fn().mockResolvedValue({ transactionId: 'tx_123' }) };
const mockEmail = { sendOrderConfirmation: jest.fn() };

const useCase = new PlaceOrderUseCase(mockOrderRepo, mockPayment, mockEmail);
const result = await useCase.execute(testInput);
```

### Austauschbarkeit
```typescript
// Wechsel von PostgreSQL zu MongoDB: nur die Repository-Implementierung ändern
class MongoOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    await this.collection.insertOne(order.toDocument());
  }
}

// PlaceOrderUseCase bleibt unverändert!
```

---

## Clean Architecture vs. MVC

| | MVC | Clean Architecture |
|---|---|---|
| Komplexität | Gering | Hoch |
| Testbarkeit | Mittel | Hoch |
| Flexibilität | Mittel | Hoch |
| Lernkurve | Niedrig | Hoch |
| Ideal für | Einfache Apps | Komplexe, langlebige Apps |

> [!IMPORTANT]
> Clean Architecture ist **nicht für jedes Projekt geeignet**. Für ein MVP oder eine kleine App ist es Overkill. Wende es an, wenn dein Projekt wächst und du merkst, dass Tests schwer zu schreiben sind oder Änderungen überall Auswirkungen haben.

---

## Praktischer Einstieg

Du musst nicht alles auf einmal umsetzen. Starte mit diesen zwei Schritten:

1. **Trenne Geschäftslogik von HTTP-Code**: Keine Datenbankaufrufe in Route-Handlern
2. **Verwende Interfaces für externe Abhängigkeiten**: Dann kannst du sie in Tests durch Mocks ersetzen

Das sind die 80% des Nutzens mit 20% der Komplexität.

---

## Wie Venator dir hilft

Wenn du ein langlebiges Projekt planst oder ein Team von mehr als 2-3 Entwicklern hast, empfiehlt Venator Clean Architecture als Ansatz. Du bekommst eine klare Erklärung, welche Schichten du für dein spezifisches Projekt brauchst — ohne die Theorie-Überwältigung.

## Weiterführende Artikel

- [Hexagonal Architecture für Einsteiger](/learn/hexagonal-architecture)
- [Domain-Driven Design Grundlagen](/learn/domain-driven-design)
- [ORM vs Raw SQL: Was solltest du wählen?](/learn/orm-vs-raw-sql)
