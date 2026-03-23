export const ARCHITECTURE_JSON_PATTERN = `
Output must be a single JSON object with this exact shape:
{
  "components": [
    {
      "name": "string (2-80 chars, unique, case-insensitive)",
      "tech": "string (2-120 chars)",
      "reason": "string (8-220 chars, concise and beginner-friendly)",
      "alternatives": ["string", "string"],
      "risks": ["string"],
      "category": "one of: frontend | backend | database | auth | hosting | storage | email | payments | monitoring | queue | realtime | cdn | ai | cms | api | mobile | devops | testing | orm",
      "difficulty": "one of: beginner | intermediate | advanced",
      "pricing": "one of: free | freemium | paid | open-source"
    }
  ],
  "connections": [
    {
      "from": "string (must match an existing component name)",
      "to": "string (must match an existing component name)",
      "type": "string"
    }
  ]
}

━━━ ALLOWED TECHNOLOGIES ━━━
You MUST only recommend technologies from this curated list. Do not suggest anything outside it.

FRONTEND FRAMEWORKS
  Next.js, Nuxt, SvelteKit, Remix, Astro, Angular, Vue.js, React (Vite),
  Solid.js, Qwik, Gatsby, Eleventy

BACKEND RUNTIMES & FRAMEWORKS
  Node.js (Express / Fastify / Hono / Koa), Bun, Deno,
  Python (FastAPI / Django / Flask), Go, Rust (Axum),
  Java (Spring Boot), PHP (Laravel), Ruby on Rails, .NET (ASP.NET Core)

DATABASES — RELATIONAL
  PostgreSQL, MySQL, SQLite, CockroachDB, Neon, PlanetScale, Turso, Xata

DATABASES — NOSQL / DOCUMENT
  MongoDB (Atlas), Firebase Firestore, Fauna, Convex, Couchbase

DATABASES — KEY-VALUE / CACHE
  Redis, Upstash Redis, Memcached, Cloudflare KV, DynamoDB

DATABASES — SEARCH & VECTOR
  Elasticsearch, MeiliSearch, Typesense, Algolia,
  Pinecone, Weaviate, Qdrant, Chroma

DATABASES — TIME-SERIES & GRAPH
  InfluxDB, TimescaleDB, Neo4j, FaunaDB

ORM / QUERY BUILDERS
  Prisma, Drizzle ORM, TypeORM, Sequelize, Knex.js,
  SQLAlchemy, Hibernate, Active Record (Rails), Entity Framework

HOSTING & DEPLOYMENT
  Vercel, Railway, Fly.io, Render, Netlify,
  AWS (EC2 / Lambda / ECS / Amplify / Elastic Beanstalk),
  Google Cloud (GCP — Cloud Run / App Engine / GKE),
  Microsoft Azure (App Service / Functions / AKS),
  DigitalOcean (App Platform / Droplets), Hetzner Cloud,
  Cloudflare Workers / Pages, Supabase Edge Functions

AUTHENTICATION & IDENTITY
  Supabase Auth, Auth.js (NextAuth), Clerk, Firebase Auth,
  Auth0, Okta, Keycloak, Kinde, WorkOS, Better Auth, Lucia Auth,
  AWS Cognito, Azure AD B2C

FILE STORAGE & MEDIA
  Supabase Storage, AWS S3, Cloudflare R2, Google Cloud Storage,
  Azure Blob Storage, Backblaze B2, UploadThing, MinIO,
  ImageKit, Cloudinary, Bunny.net Storage, Uploadcare

CDN & EDGE NETWORK
  Cloudflare CDN, AWS CloudFront, Fastly, Akamai,
  Bunny.net CDN, jsDelivr, Netlify Edge

EMAIL & NOTIFICATIONS
  Resend, SendGrid, Postmark, Mailgun, AWS SES,
  Brevo (Sendinblue), Loops, Nodemailer,
  Twilio SMS, Vonage, Sinch,
  Pusher, Ably, OneSignal, Firebase Cloud Messaging (FCM),
  Apple Push Notification Service (APNs)

PAYMENTS & BILLING
  Stripe, Lemon Squeezy, Paddle, PayPal, Braintree,
  Square, Chargebee, Recurly, Zuora, Adyen

MESSAGE QUEUES & BACKGROUND JOBS
  BullMQ, Inngest, Trigger.dev, QStash (Upstash),
  RabbitMQ, AWS SQS, Apache Kafka, Google Pub/Sub,
  Temporal, Celery (Python), Sidekiq (Ruby)

REALTIME & WEBSOCKETS
  Supabase Realtime, Socket.io, Pusher Channels, Ably,
  Liveblocks, PartyKit, AWS API Gateway WebSocket, Soketi

AI & LLM INTEGRATION
  Anthropic Claude API, OpenAI API, Google Gemini API,
  Mistral API, Cohere API, Replicate, Hugging Face Inference API,
  Vercel AI SDK, LangChain, LlamaIndex, Ollama (local LLMs)

CMS & CONTENT
  Contentful, Sanity, Strapi, Directus, Payload CMS,
  Ghost, WordPress (headless via REST/GraphQL),
  Builder.io, Storyblok, Prismic, Hygraph

API LAYER & PROTOCOLS
  REST, GraphQL (Apollo Server / Pothos / Yoga),
  tRPC, gRPC, Server-Sent Events (SSE), WebSockets,
  SOAP, OpenAPI / Swagger

MONITORING, LOGGING & ANALYTICS
  Sentry, PostHog, Logtail (Better Stack), Datadog,
  New Relic, Grafana + Prometheus, OpenTelemetry,
  LogRocket, FullStory, Mixpanel, Amplitude,
  Plausible Analytics, Umami, Axiom, Highlight.io

MOBILE DEVELOPMENT
  React Native, Expo, Flutter, Capacitor, Ionic,
  Swift (iOS native), Kotlin (Android native),
  Tauri (desktop / mobile hybrid)

DEVOPS & CI/CD
  GitHub Actions, GitLab CI/CD, CircleCI, Bitbucket Pipelines,
  Docker, Docker Compose, Kubernetes (K8s), Helm,
  Terraform, Pulumi, Ansible, AWS CDK

TESTING
  Vitest, Jest, Playwright, Cypress, Testing Library,
  Supertest, k6 (load testing), Storybook

FEATURE FLAGS & A/B TESTING
  LaunchDarkly, Unleash, Flagsmith, GrowthBook, PostHog Feature Flags

━━━ COMPONENT RULES ━━━
- Each component represents exactly one architectural responsibility (e.g. "User Authentication", not "Auth + DB").
- "name": Short, descriptive label a beginner would understand (e.g. "Next.js Frontend", "Supabase Database").
- "tech": Include the technology name AND a one-phrase description of what it does in this project
  (e.g. "Supabase (PostgreSQL) — stores user profiles, projects, and architecture decisions").
- "reason": Explain WHY this technology was chosen for THIS specific project in plain language.
  Mention one concrete benefit relevant to the user's idea. Max 220 chars.
- "alternatives": 2 realistic alternatives from the allowed list, written as "TechName — one-line trade-off"
  (e.g. "Railway — simpler deploys but less free tier than Vercel").
- "risks": 1–3 specific, honest risks a beginner might actually run into with this choice.
- "category": Pick the single best category from: frontend, backend, database, auth, hosting, storage, email, payments, monitoring, queue, realtime, cdn, ai, cms, api, mobile, devops, testing, orm
- "difficulty": Rate the learning curve for a beginner: beginner (easy, great docs, minimal config), intermediate (some concepts to learn), advanced (steep learning curve or complex setup)
- "pricing": free (always free), freemium (free tier + paid plans), paid (requires payment), open-source (self-hostable, free if you manage it)
- max 80 components, no isolated components when more than two exist.

━━━ CONNECTION RULES ━━━
- Each connection must describe the actual data flow, not just a label.
- "type": Must follow the pattern: "<protocol or mechanism> — <what data flows and why>"
  Examples:
    "HTTPS REST — sends form data to create/read user records"
    "Supabase Realtime — pushes live updates to the frontend on new messages"
    "OAuth2 redirect — forwards auth token after login to establish session"
    "Webhook POST — notifies backend of successful Stripe payment event"
    "SMTP — delivers transactional emails triggered by user signup"
    "BullMQ job — queues image processing tasks asynchronously"
    "gRPC — streams audio chunks from mobile client to transcription service"
- No self-links (from === to).
- No duplicate connections with same from, to, and type.
- max 300 connections.

━━━ STYLE ━━━
- Write everything as if explaining to someone who has never built software before.
- Avoid jargon. If a technical term is unavoidable, briefly clarify it in the same string.
- Be specific to the user's project idea — do not give generic answers.
`;
