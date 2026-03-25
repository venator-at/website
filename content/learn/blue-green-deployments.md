---
title: "Blue-Green Deployments erklärt"
description: "Blue-Green Deployments einfach erklärt: Wie du neue Versionen ohne Ausfallzeit deployst, den Traffic umschaltest und bei Problemen sofort rollbackst."
category: "Deployment & Hosting"
order: 40
keywords: ["Blue-Green Deployment", "Zero Downtime Deployment", "Deployment-Strategie", "Rollback", "DevOps"]
---

## Was ist ein Blue-Green Deployment?

Stell dir vor, du willst deine App updaten. Der klassische Weg: App stoppen, neue Version deployen, App starten. Das Problem: Während des Deployments ist deine App **offline**. Für ein paar Sekunden bis Minuten können Nutzer nicht auf deine Seite zugreifen.

**Blue-Green Deployments** lösen das Problem durch Redundanz:

- Du hast **zwei identische Produktionsumgebungen**: Blau (läuft gerade) und Grün (idle)
- Du deployst die neue Version auf Grün
- Wenn Grün bereit ist, schaltest du den Traffic von Blau zu Grün um
- Keine Ausfallzeit, sofortiger Rollback möglich

```
Vor dem Deployment:
Load Balancer → [BLAU (v1)] → Nutzer erhalten v1
               [GRÜN  (idle)]

Deployment läuft:
Load Balancer → [BLAU (v1)] → Nutzer erhalten weiterhin v1
               [GRÜN  (v2)] → Tests laufen auf v2

Nach dem Deployment:
Load Balancer → [BLAU (idle)] → Rollback sofort möglich
               [GRÜN  (v2)]  → Nutzer erhalten v2
```

---

## Der genaue Ablauf

### Schritt 1: Neue Version auf Grün deployen

```bash
# Beispiel mit Kubernetes
kubectl apply -f deployment-green.yaml

# green-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      slot: green
  template:
    metadata:
      labels:
        app: myapp
        slot: green
        version: "2.0"
    spec:
      containers:
        - name: myapp
          image: myapp:2.0
```

### Schritt 2: Grün testen

```bash
# Temporäre URL für Green-Environment (für interne Tests)
curl https://green.myapp.internal/health
# → {"status": "ok", "version": "2.0"}

# Smoke Tests laufen lassen
npm run test:smoke -- --url=https://green.myapp.internal
```

### Schritt 3: Traffic umschalten

```bash
# Load Balancer: Traffic von Blau zu Grün umschalten
kubectl patch service myapp-service \
  -p '{"spec": {"selector": {"slot": "green"}}}'

# → Ab sofort erhalten alle Nutzer v2 von Grün
```

### Schritt 4: Bei Problemen — sofortiger Rollback

```bash
# Rollback: Traffic zurück zu Blau (v1)
kubectl patch service myapp-service \
  -p '{"spec": {"selector": {"slot": "blue"}}}'

# → In Sekunden zurück zu v1, ohne erneuten Deployment-Prozess
```

---

## Blue-Green auf Vercel — automatisch

Vercel macht Blue-Green Deployments transparent:

```bash
git push origin main
# → Vercel baut die neue Version parallel
# → Neue Version wird auf Subdomains getestet (xxx.vercel.app)
# → Bei erfolgreichem Build: Traffic-Umschaltung
# → Rollback: Ein Klick im Dashboard
```

Du musst nichts konfigurieren — Vercel erledigt das automatisch.

---

## Blue-Green vs. andere Deployment-Strategien

### Rolling Deployment

Statt zwei separater Umgebungen: Instanzen werden nacheinander aktualisiert.

```
Instanz 1: v2 → v1 → v1
Instanz 2: v1 → v2 → v1
Instanz 3: v1 → v1 → v2
```

**Vorteile**: Weniger Ressourcen (keine doppelte Infrastruktur)
**Nachteile**: Kurz laufen v1 und v2 gleichzeitig

### Canary Deployment

Kleine Prozentsätze des Traffics bekommen die neue Version:

```
5% der Nutzer → v2 (Canary)
95% der Nutzer → v1

→ Wenn v2 stabil: 20% → v2
→ Wenn v2 stabil: 50% → v2
→ Wenn v2 stabil: 100% → v2
```

**Vorteile**: Risiko minimiert — Fehler betreffen nur wenige Nutzer
**Nachteile**: Komplexer, länger dauernder Rollout

| Strategie | Ausfallzeit | Rollback | Ressourcen |
|---|---|---|---|
| In-Place | Ja | Langsam | Minimal |
| Rolling | Nein (meist) | Mittel | Normal |
| Blue-Green | Nein | Sofort | 2x |
| Canary | Nein | Automatisch | 2x |

---

## Datenbankmigrationen und Blue-Green

Das Schwierigste bei Blue-Green Deployments: Datenbankmigrationen.

**Problem**: Wenn v2 ein anderes Datenbankschema braucht, aber v1 noch läuft...

**Lösung**: Additive Migrationen + mehrphasiger Rollout (expand-contract-pattern):

```
Phase 1 — Expand (Blau läuft noch):
  → Migration: neue Spalte `display_name` hinzufügen (nullable)
  → Grün (v2) schreibt in beide Spalten: `username` und `display_name`
  → Blau (v1) liest weiter aus `username` → alles kompatibel

Phase 2 — Umschalten:
  → Traffic zu Grün (v2) umschalten
  → v2 liest aus `display_name`, schreibt in beide

Phase 3 — Contract:
  → Wenn v1 nicht mehr läuft: Spalte `username` entfernen
```

> [!IMPORTANT]
> Niemals destruktive Migrationen (Spalte löschen, umbenennen) durchführen, bevor die alte Version vollständig abgeschaltet ist. Das ist die häufigste Fehlerquelle bei Blue-Green Deployments.

---

## Wann Blue-Green einsetzen?

### Ja, wenn...

- Du dir **keine Ausfallzeit** leisten kannst (E-Commerce, SaaS mit SLA)
- Du **schnelle Rollbacks** brauchst
- Du genug Infrastruktur hast, um zwei Umgebungen zu betreiben

### Nein, wenn...

- Dein **MVP** noch keine Zero-Downtime-Anforderungen hat
- Deine Nutzerbasis so klein ist, dass kurze Downtimes tolerierbar sind
- Du auf **Vercel** bist — da passiert es automatisch

---

## Wie Venator dir hilft

Wenn du Hosting und Deployment planst, erklärt Venator, welche Deployment-Strategie zu deiner Infrastruktur passt. Für Vercel-Projekte erklärt Venator, dass Blue-Green automatisch funktioniert. Für eigene Server gibt es eine Schritt-für-Schritt-Anleitung.

## Weiterführende Artikel

- [Docker für Entwickler: Ein praktischer Einstieg](/learn/docker-fuer-entwickler)
- [CI/CD Pipelines erklärt](/learn/cicd-pipelines)
- [Datenbankmigrationen richtig durchführen](/learn/datenbankmigrationen)
