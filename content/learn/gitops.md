---
title: "GitOps: Infrastruktur mit Git verwalten"
description: "GitOps einfach erklärt: Warum du deine Infrastruktur wie Code behandeln solltest, wie Pull-Request-basiertes Deployment funktioniert und welche Tools du dafür brauchst."
category: "Deployment & Hosting"
order: 41
keywords: ["GitOps", "Infrastructure as Code", "Kubernetes", "ArgoCD", "Deployment-Automatisierung"]
---

## Was ist GitOps?

Bei der traditionellen Infrastrukturverwaltung führst du Befehle manuell aus, klickst im Dashboard und machst Änderungen direkt auf dem Server. Das Problem: Niemand weiß genau, was wann geändert wurde, Rollbacks sind schmerzhaft, und "Works on my machine" gilt auch für Infrastruktur.

**GitOps** überträgt die bewährten Git-Workflows der Software-Entwicklung auf die Infrastruktur:

> "Git ist die einzige Quelle der Wahrheit — für Code UND Infrastruktur."

Alles, was deine Infrastruktur beschreibt (Server, Netzwerke, Kubernetes-Configs, Deployments), liegt in einem Git-Repository. Änderungen werden über Pull Requests gemacht, reviewed und gemergt.

---

## Die vier GitOps-Prinzipien

### 1. Deklarativ

Statt "führe diesen Befehl aus" beschreibst du den **gewünschten Zustand**:

```yaml
# ❌ Imperativ (wie)
kubectl scale deployment myapp --replicas=3
kubectl set image deployment/myapp myapp=myapp:2.0

# ✓ Deklarativ (was)
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: myapp
          image: myapp:2.0
```

### 2. Versioniert

Alle Konfigurationen sind in Git — vollständige History, wer hat was wann geändert und warum.

```bash
git log --oneline kubernetes/
# a1b2c3d feat: scale up to 3 replicas for launch
# d4e5f6g fix: increase memory limit for db-service
# g7h8i9j chore: update nginx config for new domain
```

### 3. Automatisch angewendet

```
Git main Branch ──→ CI/CD-System ──→ Infrastruktur
     (Wahrheit)    (ArgoCD/Flux)    (automatisch synchronisiert)
```

Wenn du eine Kubernetes-Config in Git änderst, wird sie automatisch auf dem Cluster angewendet — du musst nichts manuell tun.

### 4. Kontinuierlich überwacht

Das GitOps-System erkennt automatisch, wenn der echte Zustand vom gewünschten Zustand abweicht:

```
Git sagt: 3 Replicas
Cluster hat: 2 Replicas (eine ist abgestürzt)
→ GitOps-System erkennt Divergenz → startet automatisch 3. Replica
```

---

## GitOps in der Praxis: GitHub Actions + Vercel

Auch wenn du kein Kubernetes verwendest, nutzt du bereits GitOps-Prinzipien:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

Das ist GitOps: Ein Push auf `main` → automatischer Deploy. Kein manuelles Eingreifen.

---

## GitOps für Kubernetes: ArgoCD

Für Kubernetes-basierte Infrastruktur ist **ArgoCD** das populärste GitOps-Tool:

```yaml
# argocd-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  source:
    repoURL: https://github.com/mein-user/mein-repo
    targetRevision: main
    path: kubernetes/
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true     # Entfernt Ressourcen, die aus Git gelöscht wurden
      selfHeal: true  # Korrigiert manuelle Änderungen automatisch
```

ArgoCD überwacht das Git-Repository und synchronisiert automatisch alle Änderungen auf dem Kubernetes-Cluster.

---

## Infrastructure as Code (IaC) — das Fundament

GitOps baut auf **Infrastructure as Code (IaC)** auf: Infrastruktur wird als Code beschrieben und in Git gespeichert.

### Terraform

```hcl
# main.tf — Infrastruktur für eine Web-App
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.small"

  tags = {
    Name = "MyApp-Web-Server"
  }
}

resource "aws_rds_instance" "db" {
  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t3.micro"
  db_name        = "myapp"
  username       = "admin"
  password       = var.db_password
}
```

```bash
# Änderungen planen (zeigt was passieren würde)
terraform plan

# Änderungen anwenden
terraform apply
```

### Pulumi — IaC mit TypeScript

```typescript
// index.ts — Infrastruktur als TypeScript
import * as aws from "@pulumi/aws";

const server = new aws.ec2.Instance("web-server", {
  ami: "ami-0c55b159cbfafe1f0",
  instanceType: "t3.small",
  tags: { Name: "MyApp-Web" },
});

export const publicIp = server.publicIp;
```

---

## GitOps Workflow: Pull Request als Deployment

```
1. Entwickler: "Ich will 5 Replicas statt 3"
2. Erstellt Branch: feature/scale-up
3. Ändert kubernetes/deployment.yaml: replicas: 5
4. Erstellt Pull Request
5. Kollege reviewed: "Macht Sinn, approved"
6. PR wird gemergt → GitHub Actions triggered
7. ArgoCD erkennt Änderung → wendet Deployment an
8. Kubernetes skaliert auf 5 Replicas

→ Vollständige Audit-Trail in Git!
```

---

## Wann GitOps einsetzen?

### Ja, wenn...

- Du **Kubernetes** oder komplexe Cloud-Infrastruktur betreibst
- Du ein **Team** hast, das Infrastrukturänderungen reviewen soll
- **Compliance** erfordert Audit-Trails für alle Infrastrukturänderungen
- Du häufige Deployments hast und manuelles Deployen zu fehleranfällig wird

### Noch nicht nötig, wenn...

- Du auf **Vercel, Railway oder Render** hostest — die machen GitOps für dich
- Du ein **MVP** oder kleines Projekt baust
- Du **alleine** arbeitest und kein Review-Prozess nötig ist

> [!NOTE]
> Die Prinzipien von GitOps (Deklarativ, Versioniert, Automatisch) gelten für jedes Projekt — auch wenn du kein Kubernetes verwendest. Automatische Deployments via GitHub Actions + Vercel sind bereits GitOps in der einfachsten Form.

---

## Wie Venator dir hilft

Wenn du dein Deployment-Setup planst, erklärt Venator, welche GitOps-Praktiken für dein Projekt angemessen sind. Für einfache Next.js-Projekte: GitHub Actions + Vercel. Für komplexere Infrastruktur: Terraform + ArgoCD.

## Weiterführende Artikel

- [CI/CD Pipelines erklärt](/learn/cicd-pipelines)
- [Docker für Entwickler: Ein praktischer Einstieg](/learn/docker-fuer-entwickler)
- [Infrastructure as Code erklärt](/learn/infrastruktur-als-code)
