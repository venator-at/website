"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { JsonEditor } from "@/components/input/json-editor";
import { ComponentDetailsSheet } from "@/components/panels/component-details-sheet";
import { layoutGraph } from "@/lib/graph/layout";
import {
  parseArchitectureJson,
  transformArchitectureToGraph,
} from "@/lib/graph/transform";
import type {
  ArchitectureComponentInput,
  ArchitectureEdge,
  ArchitectureNode,
} from "@/types/architecture";

const JSON_EXAMPLES = [
  {
    id: "microservices-platform",
    name: "Microservices Platform",
    description: "Gateway + event bus + cache + observability",
    json: `{
  "components": [
    {
      "name": "Web Frontend",
      "tech": "Next.js 15 + Tailwind",
      "reason": "Fast UX iteration with server rendering support",
      "alternatives": ["Nuxt", "SvelteKit"],
      "risks": ["Hydration bugs with mixed server/client state"]
    },
    {
      "name": "API Gateway",
      "tech": "Kong",
      "reason": "Single ingress with routing and auth policies",
      "alternatives": ["NGINX", "Traefik"],
      "risks": ["Central bottleneck if not scaled"]
    },
    {
      "name": "Auth Service",
      "tech": "Node.js + Fastify",
      "reason": "Low-latency token issuance with extensible plugins",
      "alternatives": ["Spring Boot", "Go Fiber"],
      "risks": ["Token revocation complexity"]
    },
    {
      "name": "Order Service",
      "tech": "Node.js + NestJS",
      "reason": "Strong modular structure for domain-driven logic",
      "alternatives": ["Express", "Django"],
      "risks": ["Service sprawl in larger teams"]
    },
    {
      "name": "Payment Service",
      "tech": "Node.js + Express",
      "reason": "Mature ecosystem for payment SDK integrations",
      "alternatives": ["Spring Boot", "Rails"],
      "risks": ["Security and compliance burden"]
    },
    {
      "name": "Event Bus",
      "tech": "Apache Kafka",
      "reason": "Reliable async communication and replay",
      "alternatives": ["RabbitMQ", "NATS"],
      "risks": ["Operational overhead"]
    },
    {
      "name": "Cache",
      "tech": "Redis",
      "reason": "Fast session and hot-data access",
      "alternatives": ["Memcached", "Dragonfly"],
      "risks": ["Data consistency pitfalls"]
    },
    {
      "name": "Primary Database",
      "tech": "PostgreSQL",
      "reason": "Strong consistency and transaction support",
      "alternatives": ["MySQL", "CockroachDB"],
      "risks": ["Migration coordination"]
    },
    {
      "name": "Observability",
      "tech": "Prometheus + Grafana",
      "reason": "Metrics, dashboards, and alerting visibility",
      "alternatives": ["Datadog", "New Relic"],
      "risks": ["Alert fatigue"]
    }
  ],
  "connections": [
    { "from": "Web Frontend", "to": "API Gateway", "type": "HTTPS" },
    { "from": "API Gateway", "to": "Auth Service", "type": "REST" },
    { "from": "API Gateway", "to": "Order Service", "type": "REST" },
    { "from": "API Gateway", "to": "Payment Service", "type": "REST" },
    { "from": "Order Service", "to": "Primary Database", "type": "SQL" },
    { "from": "Auth Service", "to": "Primary Database", "type": "SQL" },
    { "from": "Order Service", "to": "Cache", "type": "Read/Write Cache" },
    { "from": "Payment Service", "to": "Event Bus", "type": "Publish Event" },
    { "from": "Order Service", "to": "Event Bus", "type": "Publish Event" },
    { "from": "Observability", "to": "Auth Service", "type": "Metrics Scrape" },
    { "from": "Observability", "to": "Order Service", "type": "Metrics Scrape" },
    { "from": "Observability", "to": "Payment Service", "type": "Metrics Scrape" }
  ]
}`,
  },
  {
    id: "serverless-analytics",
    name: "Serverless Analytics",
    description: "Ingestion pipeline with data lake and warehouse",
    json: `{
  "components": [
    {
      "name": "Marketing Site",
      "tech": "Next.js",
      "reason": "SEO-friendly frontend with rapid deployment",
      "alternatives": ["Astro", "Gatsby"],
      "risks": ["Runtime mismatch between edge and node"]
    },
    {
      "name": "Edge API",
      "tech": "Cloudflare Workers",
      "reason": "Global low-latency request handling",
      "alternatives": ["Lambda@Edge", "Fastly Compute"],
      "risks": ["Runtime constraints for libraries"]
    },
    {
      "name": "Event Queue",
      "tech": "AWS SQS",
      "reason": "Decouples traffic spikes from processing",
      "alternatives": ["Kafka", "Pub/Sub"],
      "risks": ["Visibility timeout tuning"]
    },
    {
      "name": "Ingestion Worker",
      "tech": "AWS Lambda",
      "reason": "Cost-efficient event transformation",
      "alternatives": ["Cloud Run Jobs", "Azure Functions"],
      "risks": ["Cold starts under burst load"]
    },
    {
      "name": "Data Lake",
      "tech": "S3",
      "reason": "Cheap durable storage for raw events",
      "alternatives": ["GCS", "Azure Blob"],
      "risks": ["Unbounded data growth"]
    },
    {
      "name": "Warehouse",
      "tech": "BigQuery",
      "reason": "Fast analytical queries at scale",
      "alternatives": ["Snowflake", "Redshift"],
      "risks": ["Cost spikes with poor query discipline"]
    },
    {
      "name": "BI Dashboard",
      "tech": "Metabase",
      "reason": "Quick internal analytics access",
      "alternatives": ["Looker", "Superset"],
      "risks": ["Permission misconfiguration"]
    }
  ],
  "connections": [
    { "from": "Marketing Site", "to": "Edge API", "type": "HTTPS" },
    { "from": "Edge API", "to": "Event Queue", "type": "Enqueue" },
    { "from": "Event Queue", "to": "Ingestion Worker", "type": "Trigger" },
    { "from": "Ingestion Worker", "to": "Data Lake", "type": "Object Write" },
    { "from": "Ingestion Worker", "to": "Warehouse", "type": "Batch Upsert" },
    { "from": "BI Dashboard", "to": "Warehouse", "type": "Read Query" }
  ]
}`,
  },
  {
    id: "ai-rag-product",
    name: "AI RAG Product",
    description: "LLM app with retrieval and background indexing",
    json: `{
  "components": [
    {
      "name": "Chat Frontend",
      "tech": "Next.js + React",
      "reason": "Streaming UI and app-router ergonomics",
      "alternatives": ["Remix", "Vue"],
      "risks": ["Streaming UI complexity"]
    },
    {
      "name": "API Backend",
      "tech": "NestJS",
      "reason": "Structured module system and guard support",
      "alternatives": ["Fastify", "Spring Boot"],
      "risks": ["Added framework overhead"]
    },
    {
      "name": "Auth Provider",
      "tech": "Auth0",
      "reason": "Managed auth lifecycle and enterprise features",
      "alternatives": ["Clerk", "Keycloak"],
      "risks": ["Vendor lock-in"]
    },
    {
      "name": "Object Storage",
      "tech": "S3",
      "reason": "Document source of truth",
      "alternatives": ["GCS", "R2"],
      "risks": ["Permission misconfigurations"]
    },
    {
      "name": "Indexer Worker",
      "tech": "Python + Celery",
      "reason": "Strong NLP ecosystem for parsing",
      "alternatives": ["Ray", "RQ"],
      "risks": ["Queue tuning complexity"]
    },
    {
      "name": "Vector Store",
      "tech": "pgvector",
      "reason": "Unified relational and vector data",
      "alternatives": ["Pinecone", "Weaviate"],
      "risks": ["Recall degradation without tuning"]
    },
    {
      "name": "Relational DB",
      "tech": "PostgreSQL",
      "reason": "Metadata consistency and joins",
      "alternatives": ["MySQL", "MariaDB"],
      "risks": ["Schema migration errors"]
    },
    {
      "name": "LLM Gateway",
      "tech": "OpenRouter",
      "reason": "Model routing and fallback handling",
      "alternatives": ["Direct OpenAI", "Azure OpenAI"],
      "risks": ["Provider variability"]
    }
  ],
  "connections": [
    { "from": "Chat Frontend", "to": "API Backend", "type": "HTTPS" },
    { "from": "Chat Frontend", "to": "Auth Provider", "type": "OIDC" },
    { "from": "API Backend", "to": "Relational DB", "type": "SQL" },
    { "from": "API Backend", "to": "Vector Store", "type": "Similarity Search" },
    { "from": "API Backend", "to": "LLM Gateway", "type": "Completion API" },
    { "from": "Object Storage", "to": "Indexer Worker", "type": "Ingest Trigger" },
    { "from": "Indexer Worker", "to": "Vector Store", "type": "Embedding Upsert" },
    { "from": "Indexer Worker", "to": "Relational DB", "type": "Metadata Upsert" }
  ]
}`,
  },
] as const;

export default function Dashboard() {
  const [jsonInput, setJsonInput] = useState<string>(JSON_EXAMPLES[0].json);
  const [activeExampleId, setActiveExampleId] = useState<string>(JSON_EXAMPLES[0].id);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureEdge[]>([]);
  const [selectedComponent, setSelectedComponent] =
    useState<ArchitectureComponentInput | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const renderVersionRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimer();
    };
  }, [clearPendingTimer]);

  const handleGenerateGraph = useCallback(() => {
    const parseResult = parseArchitectureJson(jsonInput);

    if (!parseResult.ok) {
      clearPendingTimer();
      setIsLoading(false);
      setError(parseResult.error);
      return;
    }

    renderVersionRef.current += 1;

    const transformed = transformArchitectureToGraph(
      parseResult.data,
      renderVersionRef.current,
    );
    const direction = parseResult.data.components.length > 14 ? "TB" : "LR";
    const layouted = layoutGraph(transformed.nodes, transformed.edges, direction);

    clearPendingTimer();
    setError(null);
    setIsLoading(true);
    setIsSheetOpen(false);
    setSelectedComponent(null);

    timerRef.current = window.setTimeout(() => {
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setIsLoading(false);
      timerRef.current = null;
    }, 2000);
  }, [clearPendingTimer, jsonInput]);

  const handleSelectNode = useCallback((component: ArchitectureComponentInput) => {
    setSelectedComponent(component);
    setIsSheetOpen(true);
  }, []);

  const handleLoadExample = useCallback((exampleId: string) => {
    const example = JSON_EXAMPLES.find((item) => item.id === exampleId);

    if (!example) {
      return;
    }

    setJsonInput(example.json);
    setActiveExampleId(example.id);
    setError(null);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-40 top-10 -z-10 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-32 top-28 -z-10 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse [animation-delay:700ms]" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-1/2 -z-10 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.35),rgba(2,6,23,0.85))]" />

      <main className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
        <header className="glass-panel neon-ring relative overflow-hidden rounded-2xl p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-300/0 via-cyan-300/80 to-cyan-300/0" />
          <div className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            JSON to Architecture Graph
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-100 md:text-4xl text-balance">
            Build a scalable architecture map from your thoughts
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
            Submit your architecture definition and get an animated graph. Nodes are interactive, draggable, zoomable, and exportable as PNG or SVG.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(360px,520px)_1fr]">
          <JsonEditor
            value={jsonInput}
            onChange={setJsonInput}
            onGenerate={handleGenerateGraph}
            examples={JSON_EXAMPLES.map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description,
            }))}
            activeExampleId={activeExampleId}
            onLoadExample={handleLoadExample}
            isLoading={isLoading}
            error={error}
          />

          <GraphCanvas
            nodes={nodes}
            edges={edges}
            isLoading={isLoading}
            onNodeSelect={handleSelectNode}
            onGenerate={handleGenerateGraph}
          />
        </section>
      </main>

      <ComponentDetailsSheet
        component={selectedComponent}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}
