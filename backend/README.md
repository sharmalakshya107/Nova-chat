# Backend - Nova Gear Chat API

Node.js + TypeScript + Express API. Handles chat messages (streaming and request/response), persists conversations to Postgres via Prisma, and talks to the LLM through an encapsulated provider.

## Setup

```bash
npm install
cp .env.example .env.local      # then edit DATABASE_URL and (optionally) OPENAI_API_KEY
npm run db:migrate              # create the conversations + messages tables
npm run local                   # http://localhost:8000, auto-reload
```

> Without an `OPENAI_API_KEY` the API runs in **offline mode** (keyword answers from the knowledge base). Set a key for real AI replies. `GET /api/health` reports the active mode.

## Environment variables (`.env.local`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | - | Postgres connection string. Boot fails fast if missing. |
| `PORT` | no | `8000` | |
| `NODE_ENV` | no | `development` | `local` for dev; the loader reads `.env.${NODE_ENV}`. |
| `FE_BASE_URL` | no | `http://localhost:5173` | Allowed CORS origin. |
| `OPENAI_API_KEY` | no | - | `sk-...` (OpenAI) or `sk-or-...` (OpenRouter). Unset → offline mode. |
| `LLM_BASE_URL` | no | - | Set to `https://openrouter.ai/api/v1` for OpenRouter or any OpenAI-compatible endpoint. |
| `LLM_MODEL` | no | `gpt-4.1-mini` | Use a namespaced model (e.g. `openai/gpt-4.1-mini`) with OpenRouter. |
| `LLM_MAX_TOKENS` | no | `600` | |
| `LLM_TIMEOUT_MS` | no | `15000` | |
| `CHAT_RATE_LIMIT_MAX` | no | `20` | Requests per IP per 15 min on chat endpoints. |

## Scripts

| Command | Does |
|---|---|
| `npm run local` | Run in dev with auto-reload. |
| `npm run build` | Compile to `dist/`. |
| `npm run prod` | Build, then run compiled server in production mode. |
| `npm run db:migrate` | Create/apply migrations (dev). |
| `npm run db:deploy` | Apply migrations (production / CI). |
| `npm test` | Run the test suite. |
| `npm run typecheck` | Type-check without emitting. |

## API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/chat/message` | Send a message, get a full reply. |
| `POST` | `/api/chat/message/stream` | Send a message, stream the reply over SSE. |
| `GET` | `/api/chat/history/:sessionId` | Restore a conversation (most recent 100 messages). |
| `GET` | `/api/health` | DB reachability + assistant mode (live/offline). |

## Tests

```bash
npm test     # 47 tests: knowledge retrieval, prompt assembly,
             # chat service (offline + live + streaming + failure paths)
```

Tests mock Prisma and the LLM, so they run with no database or network.

## Layout

```
src/
├── config/          env loader (fails fast), constants
├── modules/
│   ├── chat/        routes → controller → service → prompt + validation + types
│   ├── knowledge/   seeded FAQs/products/policies + keyword retrieval
│   └── health/      GET /health
├── shared/
│   ├── llm/         LlmProvider interface, OpenAI provider, resolver
│   ├── services/    Prisma client singleton
│   ├── middlewares/ error handler, validation runner, rate limiters
│   └── utils/       logger, response envelope
├── app.ts           Express assembly (helmet, CORS, routes, errors)
└── server.ts        Bootstrap: connect DB, listen, graceful shutdown
```
