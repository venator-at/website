---
title: "SaaS-Architektur planen"
description: "Multi-Tenancy, Billing, Onboarding – was SaaS von normalen Web-Apps unterscheidet."
category: "SaaS & Produkt"
order: 11
keywords: "SaaS, Software as a Service, Multi-Tenancy, Stripe, Billing, Subscriptions, Onboarding, SaaS-Architektur"
---

## Was ist SaaS?

**SaaS** (Software as a Service) bedeutet: Du baust eine Software, Nutzer zahlen eine monatliche oder jährliche Gebühr, um sie zu nutzen – statt sie einmalig zu kaufen.

Beispiele: Notion, Figma, Slack, GitHub, Venator.

Der große Unterschied zu einer normalen Web-App ist die **Monetarisierungs-Logik**: Benutzer haben Abonnements, Plans, Limits und Billing-Zyklen. Das muss von Anfang an in die Architektur eingebaut werden.

---

## Das SaaS-Datenmodell

Ein typisches SaaS hat diese grundlegende Struktur:

```
Users (Nutzer)
  └── Organizations / Workspaces (Teams)
        ├── Subscriptions (welcher Plan?)
        ├── Members (wer gehört dazu?)
        └── Projects / Items (die eigentlichen Daten)
```

```sql
-- Minimal-Schema für SaaS
CREATE TABLE organizations (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  plan        TEXT DEFAULT 'free',   -- 'free' | 'pro' | 'enterprise'
  stripe_customer_id TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  org_id      UUID REFERENCES organizations,
  user_id     UUID REFERENCES auth.users,
  role        TEXT DEFAULT 'member', -- 'owner' | 'admin' | 'member'
  PRIMARY KEY (org_id, user_id)
);
```

---

## Multi-Tenancy: Wie du Daten trennst

**Multi-Tenancy** bedeutet, dass viele Kunden (Tenants) dieselbe App und Infrastruktur nutzen, aber **niemals Daten des anderen sehen**.

Es gibt drei Ansätze:

### Ansatz 1: Shared Database, Shared Schema (am häufigsten)

Alle Kunden teilen dieselbe Datenbank, aber jede Zeile hat eine `org_id`:

```sql
CREATE TABLE projects (
  id     UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations,  -- ← Schlüssel zur Trennung
  title  TEXT NOT NULL
);

-- Row Level Security in Supabase:
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their org's projects"
ON projects FOR ALL
USING (
  org_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);
```

Mit **Row Level Security (RLS)** in Supabase/PostgreSQL ist die Trennung datenbankweit garantiert – kein Nutzer kann je Daten eines anderen sehen, selbst wenn du einen Bug im Code hast.

> [!IMPORTANT]
> **RLS ist ein Muss für SaaS.** Ohne es verlässt du dich darauf, dass du in jedem API-Endpoint manuell prüfst, ob der Nutzer Zugriff hat. Das führt unweigerlich zu Sicherheitslücken.

---

## Billing mit Stripe

**Stripe** ist der Standard für SaaS-Billing. Die wichtigsten Konzepte:

| Begriff | Bedeutung |
|---|---|
| `Customer` | Ein Stripe-Objekt für jeden zahlenden Nutzer / jede Org |
| `Product` | Dein SaaS-Plan (z.B. "Pro Plan") |
| `Price` | Der konkrete Preis (z.B. 19€/Monat) |
| `Subscription` | Die laufende Verbindung zwischen Customer und Price |
| `Webhook` | Stripe ruft deine App an, wenn sich etwas ändert |

Der Ablauf eines Abonnements:

```
1. Nutzer klickt "Upgrade auf Pro"
2. Du erstellst eine Stripe Checkout Session
3. Stripe leitet zum Bezahlformular weiter
4. Nutzer zahlt
5. Stripe schickt Webhook an deine App: "payment_intent.succeeded"
6. Deine App aktualisiert org.plan auf 'pro'
7. Nutzer sieht die Pro-Features
```

```ts
// Webhook Handler (Next.js)
export async function POST(request: Request) {
  const event = stripe.webhooks.constructEvent(
    await request.text(),
    request.headers.get("stripe-signature")!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object;
    await db.organizations.update({
      where: { stripeCustomerId: sub.customer },
      data: { plan: sub.status === "active" ? "pro" : "free" },
    });
  }
}
```

---

## Feature-Gates: Plans durchsetzen

```ts
// lib/plans.ts
const PLAN_LIMITS = {
  free:       { projects: 3,  teamMembers: 1,  aiCredits: 10 },
  pro:        { projects: 50, teamMembers: 10, aiCredits: 500 },
  enterprise: { projects: -1, teamMembers: -1, aiCredits: -1 }, // Unlimited
} as const;

export function canCreateProject(org: Organization): boolean {
  const limit = PLAN_LIMITS[org.plan].projects;
  if (limit === -1) return true; // Unlimited
  return org.projectCount < limit;
}
```

```tsx
// In der UI:
{canCreateProject(org) ? (
  <Button onClick={createProject}>Neues Projekt</Button>
) : (
  <Button onClick={() => router.push("/billing")}>
    Upgrade für mehr Projekte
  </Button>
)}
```

---

## Onboarding: Der erste Eindruck zählt

Das Onboarding entscheidet, ob ein Nutzer bleibt oder geht. Die Phasen:

```
Signup → Email verifizieren → Workspace erstellen → Ersten Wert erleben → "Aha-Moment"
```

**Was Venator für dein SaaS empfiehlt:**
- Workspace direkt bei Signup erstellen (kein extra Schritt)
- Erste Aktion vorausfüllen (z.B. Beispiel-Projekt anlegen)
- Fortschrittsbalken im Onboarding ("3 von 5 Schritten")
- E-Mail nach 24h, wenn der Nutzer keinen Wert erlebt hat

> [!TIP]
> **Messe den Aha-Moment.** Tracke, welche Aktion Nutzer in den ersten 24h durchführen, die danach 90-Tage-Retention haben. Das ist dein Aha-Moment – optimiere alles darauf, diesen Moment früher zu erreichen.
