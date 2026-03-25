# Venator

An AI-powered architecture advisor that helps beginner and junior developers plan complex software projects step by step.

## Stack

- **Next.js 15** (App Router, TypeScript strict)
- **Tailwind CSS v4** + **shadcn/ui**
- **Anthropic Claude API** — architecture recommendations
- **React Flow** (`@xyflow/react`) — interactive architecture graph
- **Firebase** — Auth + Firestore database

## Getting Started

Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.
