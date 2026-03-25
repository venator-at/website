---
title: "Backend for Frontend (BFF) Pattern erklärt"
description: "Das Backend for Frontend Pattern erklärt: Wann separate Backend-Schichten für Web, Mobile und andere Clients Sinn ergeben und wie du es umsetzt."
category: "Architektur-Grundlagen"
order: 16
keywords: ["Backend for Frontend", "BFF Pattern", "API-Architektur", "Microservices", "Mobile Backend"]
---

## Was ist das BFF Pattern?

Du baust eine App mit einer Web-Version und einer mobilen App. Beide brauchen Daten vom Backend — aber sie brauchen sie **unterschiedlich**. Die Web-App möchte detaillierte Produktseiten mit vielen Informationen. Die Mobile App möchte eine kompakte Ansicht, die schnell lädt und wenig Daten verbraucht.

Das **Backend for Frontend (BFF)** Pattern löst dieses Problem: Statt einem universellen API, das versucht, alle Clients gleichzeitig zu bedienen, erstellst du für jeden Client-Typ ein **eigenes Backend** — maßgeschneidert auf seine Bedürfnisse.

---

## Das Problem: Ein API für alle

```
Alle Clients → Generisches API → Datenquellen
```

Das klingt einfach, führt aber zu Kompromissen:

- Die **Mobile App** bekommt zu viele Daten (teuer für mobile Datenverbrauch)
- Die **Web App** muss mehrere Anfragen stellen, um alles zu bekommen
- **API-Änderungen** für einen Client können andere brechen
- Der API-Code wird immer komplexer, weil er alle Anforderungen erfüllen muss

---

## Die Lösung: Ein Backend pro Client-Typ

```
Web App   → BFF Web   ──┐
                         ├─→ Microservices / DB
Mobile App → BFF Mobile ─┘
```

Jedes BFF:
- Aggregiert Daten aus mehreren Quellen
- Formatiert sie exakt so, wie der Client es braucht
- Kann unterschiedliche Auth-Strategien implementieren
- Entwickelt sich unabhängig vom anderen BFF

---

## Praktisches Beispiel: Produktseite

### Ohne BFF — mobile App ruft drei Endpunkte auf

```
GET /api/products/42          → 40 Felder, viele unnötig
GET /api/products/42/reviews  → alle Reviews, nur 3 nötig
GET /api/users/123/wishlist   → komplette Wishlist
```

Die Mobile App macht 3 Anfragen und filtert dann selbst.

### Mit BFF — eine maßgeschneiderte Anfrage

```typescript
// BFF Mobile: GET /mobile/product-detail/42
async function getProductDetailForMobile(productId: string, userId: string) {
  // Ruft intern mehrere Services auf
  const [product, reviews, isWishlisted] = await Promise.all([
    productService.getById(productId),
    reviewService.getTopReviews(productId, { limit: 3 }),
    wishlistService.isWishlisted(userId, productId),
  ]);

  // Gibt nur zurück, was die Mobile App braucht
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.thumbnailUrl,  // klein, nicht das Original
    rating: reviews.averageRating,
    reviewCount: reviews.total,
    topReview: reviews.items[0]?.text ?? null,
    isWishlisted,
  };
}
```

Die Mobile App macht **eine** Anfrage und bekommt genau das, was sie braucht.

---

## Typische BFF-Aufgaben

Ein BFF macht typischerweise folgendes:

### 1. Daten-Aggregation
```typescript
// Kombiniere Daten aus verschiedenen Quellen
const dashboardData = await Promise.all([
  ordersService.getRecentOrders(userId),
  notificationsService.getUnread(userId),
  profileService.getSummary(userId),
]);
```

### 2. Daten-Transformation
```typescript
// Formatiere für den Client
const mobileOrder = {
  id: order.id,
  statusLabel: translateStatus(order.status),  // "In Bearbeitung" statt "processing"
  deliveryDate: formatDate(order.estimatedDelivery, 'de-DE'),
  totalFormatted: formatCurrency(order.total, 'EUR'),
};
```

### 3. Auth-Handling
```typescript
// Validiere Tokens und reichere Requests an
const user = await authService.validateToken(req.headers.authorization);
req.user = user;
```

---

## Wann BFF einsetzen?

### Ja, wenn...

- Du **mehrere Client-Typen** hast (Web, iOS, Android, TV-App)
- Verschiedene Clients haben **sehr unterschiedliche Datenanforderungen**
- Du mit **Microservices** arbeitest und die Aggregation nicht ins Frontend gehört
- Verschiedene Teams betreuen verschiedene Clients

### Nein, wenn...

- Du **nur eine Art von Client** hast
- Deine App einfach ist — ein einziges generisches API reicht
- Du kein Team hast, das das extra Backend pflegt

> [!NOTE]
> BFF ist kein Pflicht-Muster. Viele erfolgreiche Apps kommen gut ohne es aus. Überlege zuerst, ob du wirklich mehrere stark unterschiedliche Clients hast.

---

## BFF mit Next.js

Next.js macht das BFF-Pattern besonders einfach: Die **API Routes** (oder der App Router mit Route Handlers) sind dein natürliches BFF.

```typescript
// app/api/mobile/product/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Aggregiert Daten für die Mobile App
  const data = await getProductDetailForMobile(params.id, getUserId(req));
  return Response.json(data);
}
```

Dein Next.js-Backend ist dann das BFF für deine Web App, während du für die Mobile App separate Endpunkte (oder ein separates Deployment) nutzt.

> [!IMPORTANT]
> Vermeide es, Geschäftslogik in das BFF zu stecken. Das BFF sollte nur **aggregieren und transformieren** — die eigentliche Logik gehört in dedizierte Services oder dein Kern-Backend.

---

## BFF vs. API Gateway

Verwechsle BFF nicht mit einem API Gateway:

| | BFF | API Gateway |
|---|---|---|
| Zweck | Client-spezifisch | Für alle Clients |
| Enthält Logik | Ja (Aggregation) | Nein (Routing, Auth) |
| Anzahl | Einer pro Client-Typ | Einer für alles |
| Wer verwaltet es | Client-Team | Platform-Team |

Beide können **kombiniert** werden: Das Gateway kümmert sich um Auth und Routing, das BFF um die client-spezifische Aggregation.

---

## Wie Venator dir hilft

Wenn du Venator beschreibst, dass du sowohl eine Web- als auch eine Mobile-App bauen möchtest, empfiehlt die Plattform automatisch das BFF-Pattern und zeigt im Architektur-Graph, wie deine Backends strukturiert sein könnten.

Du siehst konkret, welche Services dein BFF ansprechen sollte und welche Technologien sich dafür eignen.

## Weiterführende Artikel

- [API Gateway Pattern: Wann und warum?](/learn/api-gateway-pattern)
- [REST vs GraphQL vs tRPC](/learn/rest-vs-graphql-vs-trpc)
- [Serverless Architecture: Vor- und Nachteile](/learn/serverless-architecture)
