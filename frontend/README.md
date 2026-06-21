# Frontend — Nova Gear Chat UI

SvelteKit + Svelte 5 (runes) chat interface. A full-page chat widget with live token streaming, light/dark theming, and conversation restore on reload.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
```

The dev server proxies `/api` to the backend at `http://localhost:8000` (configured in `vite.config.ts`), so no CORS setup is needed locally. Start the backend first.

## Environment variables

None are needed for local dev — the app calls `/api` and Vite proxies it.

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | production only | The deployed backend's `/api` URL (e.g. `https://your-backend/api`). Leave unset locally to use the dev proxy. |

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build. |
| `npm run preview` | Preview the production build. |
| `npm run check` | Type-check Svelte + TypeScript. |
| `npm test` | Run the test suite. |

## Tests

```bash
npm test     # 13 tests: ChatBubble (render, roles, XSS escaping, markdown)
             # + chat store (optimistic send, streaming, error rollback, session)
```

## Layout

```
src/
├── routes/                       +layout.svelte, +page.svelte
├── lib/features/chat/
│   ├── components/               ChatWidget, MessageList, ChatBubble, MessageInput, TypingIndicator
│   ├── services/                 chat API client (incl. SSE stream reader)
│   ├── stores/                   chat store (Svelte 5 runes, session persistence)
│   └── types/
├── lib/shared/                   HTTP client, theme toggle
├── app.html                      blocking theme script (no flash on load)
└── app.css                       design tokens + light/dark themes
```
