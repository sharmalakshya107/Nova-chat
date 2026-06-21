# Nova Gear — AI Live Chat Support Agent

> ## ⚠️ Reviewing this? Read first
> **The deployed link is already in live AI mode — just open it and chat.**
>
> **Running locally?** The app needs an LLM API key for real AI answers. **Without a key it falls back to an offline FAQ mode** (keyword answers, no live LLM) — a safety net, not the full experience. To run with real AI:
> ```bash
> cd backend
> cp .env.example .env.local      # then open .env.local and set OPENAI_API_KEY
> ```
> Use an `sk-...` OpenAI key, or an `sk-or-...` OpenRouter key with `LLM_BASE_URL=https://openrouter.ai/api/v1`. The chat header shows **"Offline mode"** and `GET /api/health` reports the active mode, so you always know which is running.

A customer-support chat where an AI agent answers questions about a fictional outdoor-and-tech store ("Nova Gear"), grounded in a seeded knowledge base and backed by a real LLM. Conversations are persisted to Postgres and restored on reload.

Detailed setup lives in **[`backend/README.md`](backend/README.md)** and **[`frontend/README.md`](frontend/README.md)**.

---

## Features

- **Live token-by-token streaming** — replies stream over Server-Sent Events and render as they are generated.
- **Works with zero LLM setup** — an offline FAQ mode answers from the knowledge base when no API key is set; the header labels the mode so it is never silent.
- **OpenAI or OpenRouter** — provider is wire-compatible; switch with a single `LLM_BASE_URL` env var, no code change.
- **Light / dark theme** — toggle with system-preference default and no flash on load.
- **Persisted conversations** — every message is stored in Postgres and the conversation is restored on reload via its session id.
- **Seeded knowledge** — FAQs, a product catalog, and store policies, retrieved per message and injected into the prompt.
- **Typo-tolerant retrieval** — keyword matching tolerates one edit or an adjacent transposition (so "shippng" still matches), dependency-free.
- **Atomic persistence** — the user message and assistant reply are written together in one transaction; a failure never leaves an orphan.
- **Robust input/error handling** — validates empty/oversized/bad input, catches LLM failures, and surfaces friendly messages instead of crashing.
- **Tested + CI** — 47 backend and 13 frontend tests run on every push via GitHub Actions.

---

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js + TypeScript + Express |
| Database | PostgreSQL + Prisma ORM |
| LLM | OpenAI / OpenRouter (`gpt-4.1-mini` by default, env-configurable) |
| Frontend | SvelteKit + Svelte 5 (runes), vanilla CSS |
| Tests | Vitest (+ supertest, @testing-library/svelte) |

---

## Run it locally

**Prerequisites:** Node.js 20+, PostgreSQL 14+, and optionally an LLM API key.

**Backend**
```bash
cd backend
npm install
cp .env.example .env.local      # set DATABASE_URL and (optionally) OPENAI_API_KEY
npm run db:migrate              # create the conversations + messages tables
npm run local                   # http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

Open `http://localhost:5173`. The chat is the full page, with a light/dark toggle in the top-right.

See the per-package READMEs for full env reference, scripts, and tests.

---

## Architecture

A **modular monolith**. Feature modules (`chat`, `knowledge`, `health`) each own a `controller → service → data` slice; cross-cutting concerns (`prisma`, `llm`, middleware) live in `shared`; config is centralized in `config`. Services are plain functions, so they are easy to test and tree-shake.

**Request flow — `POST /api/chat/message`:** route (rate-limit → validate) → controller (parse) → service (find/create conversation, load history, retrieve knowledge, generate reply, persist turn) → Prisma + knowledge + LLM provider.

The frontend mirrors this under `lib/features/chat/{components,services,stores,types}`, with a Svelte 5 store that holds chat state and persists the session id to `localStorage`.

**Data model:**
```
Conversation  id  title?  channel  createdAt  updatedAt
Message       id  conversationId →  sender(user|assistant|system)  content  createdAt
```
`sender` maps 1:1 to LLM roles; `channel` is the seam for future channels (WhatsApp, Instagram); messages are append-only and indexed on `(conversationId, createdAt)`.

---

## LLM notes

- **Provider/model:** OpenAI by default (`gpt-4.1-mini`); set `LLM_MODEL` to change. Set `LLM_BASE_URL` to use OpenRouter or any OpenAI-compatible endpoint.
- **Encapsulation:** every call goes through one `LlmProvider` interface (`generateReply` + `streamReply`). The SDK is touched in a single file; adding a provider is one new file plus one line in the resolver.
- **Prompting:** a system prompt gives a clear persona and hard grounding rules (answer only from seeded knowledge, never invent prices/dates/codes), with the last 10 turns for context.
- **Guardrails:** 15s timeout, one retry on transient 429/5xx, a `max_tokens` cap, and a per-IP rate limit. On failure the user gets a friendly message and nothing broken is persisted.

---
**Left out on purpose:** vector-DB retrieval (KB is small enough to fit in context), Redis (no hot path), auth (not required), and a multi-conversation sidebar (the brief is a single live chat).
