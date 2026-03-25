---
title: "Vektor-Datenbanken und KI-Anwendungen"
description: "Vektor-Datenbanken einfach erklärt: Was Embeddings sind, wie pgvector, Pinecone und Weaviate funktionieren und wann du eine Vektor-DB für deine KI-App brauchst."
category: "Datenbanken"
order: 29
keywords: ["Vektor-Datenbank", "pgvector", "Embeddings", "Semantische Suche", "KI-Anwendungen"]
---

## Was sind Vektor-Datenbanken?

Wenn du eine normale Datenbank nach "Fahrrad" suchst, findet sie exakt das Wort "Fahrrad". Aber was, wenn du nach etwas suchen willst, das *ähnlich* wie "Fahrrad" ist? Zum Beispiel "Velo", "Zweirad" oder sogar ein Foto von einem Fahrrad?

Das ist das Problem, das **Vektor-Datenbanken** lösen. Sie arbeiten nicht mit Texten oder Werten, sondern mit **Vektoren** — mathematischen Repräsentationen von Bedeutung.

---

## Was sind Embeddings?

Ein **Embedding** ist eine Zahl-Liste (Vektor), die die *Bedeutung* eines Textes, Bildes oder anderer Daten repräsentiert:

```
"Katze"    → [0.2, -0.5, 0.8, 0.1, ..., 0.3]  (1536 Zahlen)
"Hund"     → [0.3, -0.4, 0.7, 0.2, ..., 0.4]  (1536 Zahlen)
"Automobil"→ [-0.8, 0.2, -0.1, 0.9, ..., -0.5] (1536 Zahlen)
```

"Katze" und "Hund" haben ähnliche Vektoren (beide sind Haustiere), während "Automobil" ganz anders liegt.

KI-Modelle wie OpenAI's `text-embedding-3-small` oder Anthropic's Embeddings können Text in diese Vektoren umwandeln.

---

## Wie semantische Suche funktioniert

```typescript
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const openai = new OpenAI();

// 1. Text in Embedding umwandeln
async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// 2. Suche: Ähnliche Texte finden
async function semanticSearch(query: string, limit = 5) {
  const queryEmbedding = await getEmbedding(query);

  // Ähnlichste Vektoren in der DB finden (Cosinus-Ähnlichkeit)
  const { data } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.8,
    match_count: limit,
  });

  return data;
}

// Funktioniert auch für:
semanticSearch("Haustier mit Fell")  // → findet Artikel über Katzen, Hunde...
semanticSearch("Fahrzeug ohne Motor") // → findet Artikel über Fahrräder, Segelboote...
```

---

## Retrieval-Augmented Generation (RAG)

Der beliebteste KI-Anwendungsfall für Vektor-DBs: **RAG** erlaubt KI-Modellen, über deine eigenen Dokumente zu "wissen":

```typescript
async function askAboutMyDocs(question: string): Promise<string> {
  // 1. Frage in Embedding umwandeln
  const questionEmbedding = await getEmbedding(question);

  // 2. Relevante Dokumente aus der Vektor-DB holen
  const { data: relevantDocs } = await supabase.rpc('match_documents', {
    query_embedding: questionEmbedding,
    match_count: 3,
  });

  // 3. Dokumente als Kontext an Claude schicken
  const context = relevantDocs.map(doc => doc.content).join('\n\n');

  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Kontext:\n${context}\n\nFrage: ${question}`
    }]
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// Jetzt kann Claude über deine privaten Dokumente sprechen!
await askAboutMyDocs("Was steht in unserem Datenschutz-Policy über Cookies?");
```

---

## pgvector — Vektor-DB in PostgreSQL

**pgvector** ist eine PostgreSQL-Erweiterung, die Vektor-Suche direkt in PostgreSQL bringt. **Supabase** hat pgvector bereits eingebaut!

```sql
-- Erweiterung aktivieren (bereits in Supabase aktiviert)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabelle mit Vektor-Spalte
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536)  -- 1536 Dimensionen für OpenAI-Embeddings
);

-- Effektiver Index für Ähnlichkeitssuche
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

```sql
-- Funktion für Ähnlichkeitssuche
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE(id UUID, content TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, content,
    1 - (embedding <=> query_embedding) as similarity
  FROM documents
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

> [!NOTE]
> Mit Supabase + pgvector hast du eine vollständige Vektor-Datenbank, ohne zusätzliche Infrastruktur zu brauchen. Ideal für die meisten KI-Projekte.

---

## Spezialisierte Vektor-Datenbanken

Wenn pgvector nicht reicht (sehr große Datenmengen, spezialisierte Features):

### Pinecone — einfach, managed, skalierbar

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pinecone.index('my-index');

// Vektoren speichern
await index.upsert([
  { id: 'doc1', values: embedding1, metadata: { text: 'Inhalt 1' } },
  { id: 'doc2', values: embedding2, metadata: { text: 'Inhalt 2' } },
]);

// Ähnliche Vektoren suchen
const results = await index.query({
  vector: queryEmbedding,
  topK: 5,
  includeMetadata: true,
});
```

### Weaviate — Open Source, selbst hostbar

Gut wenn du die Daten selbst kontrollieren möchtest und nicht auf managed Services angewiesen sein willst.

### Qdrant — performant, selbst hostbar

Sehr schnell, gut für On-Premise-Deployments.

---

## Vergleich der Optionen

| | pgvector (Supabase) | Pinecone | Weaviate | Qdrant |
|---|---|---|---|---|
| Hosting | In Supabase | Managed | Self/Managed | Self/Managed |
| Einstieg | Sehr einfach | Einfach | Mittel | Mittel |
| SQL-Kompatibilität | Ja | Nein | Nein | Nein |
| Skalierung | Mittel | Sehr hoch | Hoch | Hoch |
| Kosten | Im Supabase-Plan | Pay-per-use | Kostenlos (self) | Kostenlos (self) |
| Ideal für | MVP, mittelgroße Apps | Große Datenmengen | Enterprise | Performance-kritisch |

---

## Wann brauchst du eine Vektor-DB?

### Ja, wenn...

- Du **semantische Suche** implementieren willst ("finde ähnliche Artikel")
- Du **RAG** (Retrieval-Augmented Generation) baust — KI über eigene Dokumente
- Du eine **Empfehlungs-Engine** baust
- Du **Duplikat-Erkennung** brauchst (ähnliche Inhalte finden)

### Nein, wenn...

- Einfache Keyword-Suche reicht
- Du keine KI-Features brauchst
- Du noch kein MVP hast — baue erst das Kern-Produkt

> [!IMPORTANT]
> Starte mit **pgvector auf Supabase** — du brauchst keinen zusätzlichen Service. Wechsle nur zu Pinecone oder Weaviate, wenn du wirklich sehr große Datenmengen (> 1 Million Vektoren) oder spezielle Features brauchst.

---

## Wie Venator dir hilft

Wenn du KI-Features in deinem Projekt planst — wie Dokumentensuche, Chatbots über eigene Inhalte oder Empfehlungssysteme — empfiehlt Venator die passende Vektor-DB-Lösung. Für Supabase-Projekte erscheint pgvector als erste, kostengünstige Option.

## Weiterführende Artikel

- [Authentifizierung Grundlagen](/learn/authentication)
- [PostgreSQL vs MySQL: Der direkte Vergleich](/learn/postgresql-vs-mysql)
- [Serverless Architecture: Vor- und Nachteile](/learn/serverless-architecture)
