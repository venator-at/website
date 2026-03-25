---
title: "RBAC vs ABAC: Zugriffskontrollen verstehen"
description: "RBAC und ABAC einfach erklärt: Rollenbasierte vs. attributbasierte Zugriffskontrolle — mit konkreten Beispielen und Empfehlungen, welches System du für dein Projekt brauchst."
category: "Authentifizierung & Sicherheit"
order: 33
keywords: ["RBAC", "ABAC", "Zugriffskontrolle", "Autorisierung", "Berechtigungen"]
---

## Was ist Zugriffskontrolle?

**Authentifizierung** beantwortet: *Wer bist du?*
**Autorisierung** beantwortet: *Was darfst du tun?*

Nachdem ein Nutzer eingeloggt ist, muss dein System entscheiden: Darf er dieses Dokument lesen? Darf er diesen Nutzer löschen? Darf er diese Einstellung ändern?

Es gibt zwei dominante Systeme für diese Entscheidungen: **RBAC** und **ABAC**.

---

## RBAC — Role-Based Access Control

**Idee**: Berechtigungen werden **Rollen** zugewiesen, Nutzer bekommen Rollen.

```
Nutzer Max → Rolle "Editor" → Darf: Artikel erstellen, bearbeiten
Nutzer Anna → Rolle "Admin" → Darf: alles
Nutzer Ben → Rolle "Viewer" → Darf: nur lesen
```

### Implementierung in der Datenbank

```sql
-- Rollen-Tabelle
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL  -- 'admin', 'editor', 'viewer'
);

-- Berechtigungen
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  action TEXT NOT NULL,   -- 'create', 'read', 'update', 'delete'
  resource TEXT NOT NULL  -- 'articles', 'users', 'settings'
);

-- Rollen → Berechtigungen (Many-to-Many)
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- Nutzer → Rollen
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id),
  role_id UUID REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
```

### TypeScript-Implementierung

```typescript
type Permission = `${string}:${string}`;  // z. B. "articles:create"

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ['articles:create', 'articles:read', 'articles:update', 'articles:delete', 'users:manage'],
  editor: ['articles:create', 'articles:read', 'articles:update'],
  viewer: ['articles:read'],
};

async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  const userRoles = await getUserRoles(userId);

  return userRoles.some(role =>
    ROLE_PERMISSIONS[role]?.includes(permission)
  );
}

// Verwendung
const canEdit = await hasPermission(user.id, 'articles:update');
if (!canEdit) {
  throw new ForbiddenError('Keine Berechtigung');
}
```

### Mit Supabase Row Level Security

```sql
-- Supabase RLS: Nur Admins und Autoren dürfen Artikel lesen (falls unveröffentlicht)
CREATE POLICY "Read articles" ON articles
  FOR SELECT USING (
    published = true
    OR auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );
```

---

## ABAC — Attribute-Based Access Control

**Idee**: Berechtigungen werden durch **Attribute** von Nutzer, Ressource und Kontext bestimmt.

Statt starrer Rollen: Entscheidungen basieren auf flexiblen Regeln.

```
Darf Nutzer Max den Artikel bearbeiten?
→ Prüfe: Ist Max der Autor? UND Ist der Artikel nicht archiviert? UND Ist Max im selben Team?
→ Entscheidung: Ja/Nein
```

### Implementierung

```typescript
interface User {
  id: string;
  department: string;
  clearanceLevel: number;
  roles: string[];
}

interface Resource {
  type: string;
  ownerId: string;
  department: string;
  classification: 'public' | 'internal' | 'confidential' | 'secret';
  createdAt: Date;
}

interface Context {
  ipAddress: string;
  time: Date;
  location: string;
}

type Decision = 'allow' | 'deny';

class AbacEngine {
  can(user: User, action: string, resource: Resource, context: Context): Decision {
    // Regel 1: Nutzer kann eigene Ressourcen immer lesen
    if (action === 'read' && resource.ownerId === user.id) return 'allow';

    // Regel 2: Nur höhere Sicherheitsstufe kann confidential lesen
    if (resource.classification === 'confidential' && user.clearanceLevel < 3) return 'deny';

    // Regel 3: Nur innerhalb der Abteilung bearbeiten
    if (action === 'update' && resource.department !== user.department) return 'deny';

    // Regel 4: Nachts keine Produktionsänderungen (Zeitfenster)
    const hour = context.time.getHours();
    if (action === 'delete' && (hour < 8 || hour > 18)) return 'deny';

    // Standardmäßig: Admins dürfen alles
    if (user.roles.includes('admin')) return 'allow';

    return 'deny';
  }
}
```

---

## RBAC vs. ABAC im Vergleich

| Kriterium | RBAC | ABAC |
|---|---|---|
| Komplexität | Niedrig | Hoch |
| Flexibilität | Mittel | Sehr hoch |
| Performance | Schnell | Kann langsam sein |
| Verständlichkeit | Leicht | Schwer |
| Auditing | Einfach | Komplex |
| Ideal für | < 10 Rollen | Viele Sonderfälle |

---

## Hybrides Modell — das Beste aus beiden Welten

Die meisten Systeme kombinieren beide:

```typescript
function canUpdateArticle(user: User, article: Article): boolean {
  // RBAC: Admins dürfen immer
  if (user.roles.includes('admin')) return true;

  // RBAC: Editoren haben generelle Update-Berechtigung
  if (!user.roles.includes('editor')) return false;

  // ABAC: Editoren dürfen nur eigene oder nicht-archivierte Artikel
  return article.authorId === user.id && !article.archived;
}
```

---

## Wann welches System?

### Starte mit RBAC, wenn...

- Du wenige, klar definierte Rollen hast (Admin, Editor, Nutzer, Gast)
- Dein Team klein ist und schnell iterieren muss
- Du ein MVP oder erste Version baust

### Wechsle zu (oder ergänze mit) ABAC, wenn...

- Du viele Sonderfälle und Ausnahmen hast
- Berechtigungen von vielen Faktoren abhängen (Zeit, Ort, Eigentümerschaft)
- Du strenge Compliance-Anforderungen hast (ISO 27001, DSGVO)

> [!NOTE]
> Für die meisten Web-Apps reicht **RBAC** vollständig. Starte damit und füge ABAC-Elemente (Eigentümerprüfung, etc.) nur dort hinzu, wo du sie brauchst.

---

## Wie Venator dir hilft

Wenn du Nutzerrollen und Berechtigungen in deinem Projekt beschreibst, empfiehlt Venator entweder ein einfaches RBAC-Modell oder erklärt, wann du ABAC-Elemente brauchst. Du bekommst konkrete SQL-Schemas und TypeScript-Implementierungen für dein Setup.

## Weiterführende Artikel

- [OAuth2 Flow Schritt für Schritt erklärt](/learn/oauth2-flow)
- [Sicherheitsgrundlagen für Web-Apps](/learn/security-basics)
- [Authentifizierung Grundlagen](/learn/authentication)
