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

Next recommended tasks (short-term)
1) Small, focused: Model/provider integration (Milestone 2, step 1)
   - Add a very small provider implementation that calls an external model API behind an env flag (e.g. PROVIDER=openai). Keep it optional and behind env vars.
   - Acceptance: when PROVIDER=openai is set, the forward route should attempt to connect and return a safe error if credentials are missing. No secrets in repo.

2) Streaming format & compatibility
   - Decide on streaming token format (SSE vs JSONL) and update both server + client accordingly. This is a larger task — do it after a provider is wired.

3) Tests & CI
   - Add a lightweight smoke test (npm script) that runs the smoke scripts against a dev server started in CI, or a Node-based unit test that verifies provider selection logic.

This run (what I actually changed)
- ✅ Brought up the streaming stub endpoint and forwarding abstraction.
- ✅ Added smoke tests and updated the UI with an endpoint selector.
- ✅ Updated this Plan.md to reflect the current repository state and next steps.

Risks / tech debt
- Streaming format mismatch: front-end and future providers must agree on token framing. Plan to standardize on SSE or JSONL.
- Provider implementations can introduce secrets; always require env vars and clear error messages.
- The embedded Next.js app being its own repo may be confusing; consider consolidation.

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
