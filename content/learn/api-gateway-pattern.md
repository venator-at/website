---
title: "API Gateway Pattern: Wann und warum?"
description: "Das API Gateway Pattern erklärt: Zentraler Einstiegspunkt für Microservices, mit Routing, Auth, Rate Limiting und Logging — und wann du es wirklich brauchst."
category: "Architektur-Grundlagen"
order: 17
keywords: ["API Gateway", "Microservices", "Architekturmuster", "Rate Limiting", "Reverse Proxy"]
---

## Was ist ein API Gateway?

Stell dir vor, du hast 10 verschiedene Microservices: einen für Nutzer, einen für Bestellungen, einen für Produkte, einen für Benachrichtigungen... Jeder dieser Services hat seine eigene URL, seinen eigenen Port, seine eigene Auth-Logik.

Dein Frontend müsste mit 10 verschiedenen Endpunkten kommunizieren. Das ist chaotisch und unsicher.

Ein **API Gateway** löst dieses Problem: Es ist ein **einziger Einstiegspunkt** für alle deine Services. Der Client spricht nur mit dem Gateway — das Gateway leitet die Anfragen intern weiter.

```
Client → API Gateway → [Service A, Service B, Service C, ...]
```

---

## Was ein API Gateway macht

Ein API Gateway ist weit mehr als nur ein Router:

### 1. Routing
```
GET  /api/users    → User-Service (Port 3001)
GET  /api/orders   → Order-Service (Port 3002)
GET  /api/products → Product-Service (Port 3003)
```

Von außen sieht alles einheitlich aus. Der Client weiß nicht, dass dahinter 10 verschiedene Services laufen.

### 2. Authentifizierung & Autorisierung
```typescript
// Gateway prüft den Token für ALLE Services
app.use(async (req, res, next) => {
  const token = req.headers.authorization;

  try {
    const user = await verifyJWT(token);
    req.user = user;
    next(); // Anfrage wird weitergeleitet
  } catch {
    res.status(401).json({ error: 'Nicht autorisiert' });
  }
});
```

Jeder Service muss sich nicht selbst um Auth kümmern — das Gateway übernimmt das zentralisiert.

### 3. Rate Limiting
```typescript
// Maximal 100 Anfragen pro Minute pro IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Zu viele Anfragen. Bitte warte kurz.'
}));
```

### 4. Logging & Monitoring
Alle eingehenden Anfragen werden an einer Stelle protokolliert:
```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.id,
    });
  });
  next();
});
```

### 5. SSL-Terminierung
Das Gateway kümmert sich um HTTPS. Die internen Services können einfaches HTTP nutzen (im internen Netz).

### 6. Load Balancing
Wenn du mehrere Instanzen eines Services hast, verteilt das Gateway die Last:
```
Anfrage → Gateway → [Service A Instanz 1, Service A Instanz 2, ...]
```

---

## Beliebte API Gateway Lösungen

| Tool | Typ | Ideal für |
|---|---|---|
| **nginx** | Self-hosted | Einfaches Routing, hohe Performance |
| **Traefik** | Self-hosted | Docker/Kubernetes, automatische Service-Discovery |
| **AWS API Gateway** | Managed | AWS-basierte Projekte, Serverless |
| **Kong** | Self-hosted/Cloud | Enterprise-Grade, viele Plugins |
| **Cloudflare Workers** | Edge | Geringe Latenz weltweit |
| **Express Gateway** | Self-hosted | Node.js-Projekte, viel Kontrolle |

---

## Ein einfaches Gateway mit Express

```typescript
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';

const app = express();

// Rate Limiting für alle Anfragen
app.use(rateLimit({ windowMs: 60000, max: 100 }));

// Auth Middleware
app.use(authMiddleware);

// Routing zu den Microservices
app.use('/api/users', createProxyMiddleware({
  target: 'http://user-service:3001',
  changeOrigin: true,
}));

app.use('/api/orders', createProxyMiddleware({
  target: 'http://order-service:3002',
  changeOrigin: true,
}));

app.use('/api/products', createProxyMiddleware({
  target: 'http://product-service:3003',
  changeOrigin: true,
}));

app.listen(3000);
```

---

## Wann brauchst du ein API Gateway?

### Du brauchst es, wenn...

- Du **Microservices** oder mehrere unabhängige Backend-Services hast
- Du eine **einheitliche Auth-Schicht** brauchst
- Du **Rate Limiting zentral** verwalten willst
- Du **mehrere Client-Typen** (Web, Mobile, Third-Party) hast
- Du Traffic-Analysen und Logging **zentral** machen willst

### Du brauchst es NICHT, wenn...

- Du einen **Monolithen** oder eine simple Next.js-App hast
- Du ein **MVP** baust — bring es erst zum Laufen
- Dein Team klein ist und du keinen Ops-Overhead willst

> [!IMPORTANT]
> Viele Projekte starten ohne API Gateway und fügen es später hinzu, wenn Microservices eingeführt werden. Das ist vollkommen in Ordnung — bau nicht für Komplexität, die du noch nicht hast.

---

## API Gateway vs. Load Balancer

| | API Gateway | Load Balancer |
|---|---|---|
| Routing | Pfad-basiert | IP/Port-basiert |
| Auth | Ja | Nein |
| Rate Limiting | Ja | Nein |
| Protokolle | HTTP, WebSocket, gRPC | TCP, UDP, HTTP |
| Fokus | API-Management | Traffic-Verteilung |

Ein Load Balancer ist eine Schicht tiefer — du kannst beide kombinieren.

---

## API Gateway vs. BFF

Diese beiden Muster ergänzen sich oft:

```
Client → API Gateway (Auth, Rate Limiting) → BFF (Aggregation) → Services
```

- Das **Gateway** kümmert sich um querschneidende Belange (Cross-Cutting Concerns)
- Das **BFF** kümmert sich um client-spezifische Daten-Aggregation

> [!NOTE]
> Bei kleinen Projekten ist es völlig in Ordnung, beides im gleichen Service zu haben.

---

## Wie Venator dir hilft

Wenn du Venator beschreibst, dass du mehrere unabhängige Backend-Services oder eine Microservices-Architektur planst, empfiehlt die Plattform ein API Gateway und zeigt konkrete Tool-Empfehlungen — von einfachem nginx bis zu managed Services wie AWS API Gateway.

Im Architektur-Graph siehst du das Gateway als zentralen Knoten, durch den alle Anfragen fließen.

## Weiterführende Artikel

- [Backend for Frontend (BFF) Pattern erklärt](/learn/bff-pattern)
- [REST vs GraphQL vs tRPC](/learn/rest-vs-graphql-vs-trpc)
- [Rate Limiting implementieren](/learn/rate-limiting)
