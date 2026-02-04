# Personal Assistant Web App - Plan

Goal: Build an interactive personal assistant you can talk to directly in the browser, with streaming text responses and optional voice.

## Progress Log (this run)

Run Plan (what I intended to do)
- Add a minimal streaming backend endpoint to support the chat UI: POST /api/chat which accepts { message } and streams a stubbed reply in small chunks.
- Provide a small smoke-test script that can be used locally to verify the streaming endpoint (prints chunks as they arrive).

Why this is the next best move
- Milestone 1 requires a backend that can stream tokens to the client. Adding a simple streaming stub unlocks front-end work (UI + streaming consumption) without needing model integration.
- Small, focused change that keeps main working and is easy to iterate on.

Acceptance criteria (done means)
- claws_playground/src/app/api/chat/route.ts responds to POST with a ReadableStream that yields a stubbed multi-chunk reply.
- Smoke-test scripts are present at claws_playground/scripts and can be run with `node` to POST to the local dev server and log streamed responses.
- Plan.md is kept up-to-date describing what changed and what to do next.

What I changed (this run)
- ✅ Implemented streaming stub endpoint: `POST /api/chat` -> `claws_playground/src/app/api/chat/route.ts`.
  - Streams three chunks with short delays to simulate tokenized streaming.
  - Returns Content-Type: text/plain and disables caching.
- ✅ Added smoke-test script: `claws_playground/scripts/smoke-chat.js`.
  - Uses global fetch (Node 18+) to POST to http://localhost:3000/api/chat and print streamed chunks as they arrive.
- ✅ Added provider abstraction and forward route: `POST /api/chat/forward` -> `claws_playground/src/app/api/chat/forward/route.ts`.
  - `src/lib/provider.ts` exposes getProviderName() (reads PROVIDER env, defaults to "stub"), createStubStream(), and getChatStreamForProvider().
  - The forward route returns a stubbed ReadableStream when PROVIDER is unset or "stub", and sets an X-Provider response header when available.
- ✅ Updated the client UI to allow selecting the endpoint ("/api/chat" or "/api/chat/forward").
  - `src/app/page.tsx` includes an Endpoint selector (default: /api/chat) so you can toggle forwarding without touching env vars.
- ✅ Added an additional smoke test: `claws_playground/scripts/smoke-forward.js` to test the forwarding endpoint and print the X-Provider header.

How to run locally
1. Install deps: npm install (in claws_playground)
2. Start dev server: npm run dev
3. In another terminal, run the smoke test(s):
   - node claws_playground/scripts/smoke-chat.js
   - node claws_playground/scripts/smoke-forward.js
4. Quick manual test via curl (forward route):
   curl -N -X POST http://localhost:3000/api/chat/forward -H "Content-Type: application/json" -d '{"message":"hello"}'

Notes / discoveries
- The endpoints currently stream plain text chunks (Content-Type: text/plain). When integrating real model APIs we'll likely switch to SSE (text/event-stream) or a JSONL token format and update both client and server accordingly.
- The forward route currently treats unknown PROVIDER values as the stub provider (safe default). This keeps the app runnable without external API keys.
- The claws_playground folder is a self-contained Next.js app inside this repo (it's its own git repo). If you plan to distribute the outer repo, consider converting this into a submodule or merging histories.

---

## Additions / Suggested improvements (added on agent request)

Below are concise, actionable additions to make the project easier to consume and extend. They are written so a contributor can pick up the next tasks quickly.

### 1) API examples (copy-paste runnable)

- POST /api/chat (direct stub)
  - Request:
    - URL: http://localhost:3000/api/chat
    - Method: POST
    - Headers: Content-Type: application/json
    - Body: { "message": "Hello" }
  - curl example:
    curl -N -X POST http://localhost:3000/api/chat \
      -H "Content-Type: application/json" \
      -d '{"message":"hello"}'

- POST /api/chat/forward (provider-aware)
  - Request:
    - URL: http://localhost:3000/api/chat/forward
    - Method: POST
    - Headers: Content-Type: application/json
    - Body: { "message": "Hello" }
  - curl example:
    curl -N -X POST http://localhost:3000/api/chat/forward \
      -H "Content-Type: application/json" \
      -d '{"message":"hello"}'

- SSE mode (forward route supports ?format=sse)
  - curl example:
    curl -N -X POST "http://localhost:3000/api/chat/forward?format=sse" \
      -H "Content-Type: application/json" \
      -d '{"message":"hello"}'

Notes: use -N to prevent curl from buffering the output so streamed chunks appear as they arrive.

### 2) Provider interface & checklist

When adding a new provider implementation, follow this minimal contract so the forward route and UI remain compatible:

- Expose a function: getChatStreamForProvider(providerName: string, message: string): ReadableStream
  - Should always return a ReadableStream (never throw); for error cases return a short error stream that yields a human-readable message then closes.
  - Stream semantics:
    - Each chunk should be a UTF-8 string (partial tokens are OK).
    - If using SSE mode, the forward route will wrap these chunks into SSE "data: " lines.
- Optionally export getProviderName() that reads process.env.PROVIDER for use in tests.
- Do not embed API keys or secrets in code. Read keys from env vars and validate presence; if missing, return an error stream explaining what's missing.

Acceptance for a new provider: an added provider file that can be selected via PROVIDER env var and the forward endpoint returns a stream (or an error stream) and sets X-Provider header.

### 3) .env.example (place in claws_playground/.env.example)

A small example file to make local dev easier. DO NOT commit secrets — only example placeholders.

```
# Provider selection: stub | openai | anthopic | my-provider
PROVIDER=stub

# Example: OpenAI key (leave blank if you do not have a key)
OPENAI_API_KEY=
```

(There is a separate note in CONTRIBUTING advising to copy this to .env and fill secrets locally.)

### 4) Tests & CI suggestions

- CI smoke-test job (fast):
  - Start dev server (npm run dev) in background, wait until port is ready.
  - Run: node scripts/smoke-chat.js and node scripts/smoke-forward.js (or run the composite npm script if present).
  - Fail if either script exits with non-zero or times out.
- Unit tests for provider selection:
  - Add a small Node test that imports src/lib/provider.ts, sets process.env.PROVIDER to various values, and asserts getProviderName() and getChatStreamForProvider() behavior (stream returns quickly and yields the expected first-chunk string).

Acceptance: CI should run under 2–3 minutes and validate streaming behavior for the stub provider.

### 5) Streaming format & client contract

- Decide on a canonical streaming envelope before integrating real providers. Two viable options:
  1) SSE (text/event-stream)
     - Pros: browser-native EventSource support, simple framing (data:), easy to debug in curl.
     - Cons: EventSource doesn't allow POST by default — need to use fetch + ReadableStream or polyfill.
  2) JSONL per-line tokens
     - Pros: self-describing events (json per line), easy cross-platform parsing.
     - Cons: client must buffer line breaks and parse incrementally.

- Short-term recommendation: keep the stub behavior (plain text stream) during development and add an SSE mode (already present on forward route) for experimentation. Standardize on SSE for Milestone 2 to make token events explicit.

### 6) Developer UX: logging & error streams

- Error signaling: when a provider cannot run (missing creds, network error), return a short, human-readable error stream and set a response header X-Provider-Status: error in addition to X-Provider.
- Add a small request-id header (X-Request-Id) if the server can generate one to help correlate client and server logs.
- Log timestamps for stream start/finish and provider selected — useful in development and lightweight observability.

### 7) CONTRIBUTING & next steps (small roadmap)

Add a short CONTRIBUTING snippet (or file) describing the following developer flow:
- Setup:
  - cp .env.example .env
  - Fill OPENAI_API_KEY if you want to try the OpenAI provider
  - npm install
  - npm run dev
- Running smoke tests:
  - node scripts/smoke-chat.js
  - node scripts/smoke-forward.js
  - node scripts/smoke-forward-sse.js (if present)

Next recommended tasks (with rough estimates):
- Wire a minimal OpenAI provider stub that reads OPENAI_API_KEY and returns an error stream if missing (1 day)
- Add CI smoke-test job (0.5 day)
- Decide and standardize on SSE vs JSONL and update client/server (0.5–1 day)
- Add a simple Playwright E2E test for the client streaming behavior (1–2 days)

---

## Milestone 1: Basic chat UI (Next.js)
- Replace landing page with a chat interface ✅
- Message list + input box ✅
- Simple agent backend endpoint (/api/chat) that accepts text and returns stubbed replies ✅
- Client streaming via fetch + ReadableStream ✅

## Milestone 2: Model integration (next)
- Add a provider abstraction and env var config ✅
- Forward messages to a real model and stream tokens back (next)
- Keep conversation history

(remaining milestones unchanged)
