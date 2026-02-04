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
- claws_playground/src/app/api/chat/route.ts exists and responds to POST with a ReadableStream that yields a stubbed multi-chunk reply.
- A smoke-test script is present at claws_playground/scripts/smoke-chat.js that can be run with `node` to POST to the local dev server and log the streamed response.
- Plan.md updated with what changed and next steps.

What I changed (this run)
- ✅ Implemented streaming stub endpoint: `POST /api/chat` -> `claws_playground/src/app/api/chat/route.ts`.
  - Streams three chunks with short delays to simulate tokenized streaming.
  - Returns Content-Type: text/plain and disables caching.
- ✅ Added smoke-test script: `claws_playground/scripts/smoke-chat.js`.
  - Uses global fetch (Node 18+) to POST to http://localhost:3000/api/chat and print streamed chunks as they arrive.
- ✅ Added a provider abstraction and a new forwarding route: `POST /api/chat/forward` -> `claws_playground/src/app/api/chat/forward/route.ts`.
  - `src/lib/provider.ts` exposes getProviderName() (reads PROVIDER env, defaults to "stub"), createStubStream(), and getChatStreamForProvider().
  - The forward route reads PROVIDER, returns a stubbed ReadableStream when PROVIDER="stub", and sets an X-Provider header.

How to run locally
1. Install deps: npm install (in claws_playground)
2. Start dev server: npm run dev
3. In another terminal, run the smoke test against the original route: node claws_playground/scripts/smoke-chat.js
4. To test the forward route manually (curl):
   curl -N -X POST http://localhost:3000/api/chat/forward -H "Content-Type: application/json" -d '{"message":"hello"}'

Notes / discoveries
- The endpoint currently uses a simple ReadableStream that emits text/plain chunks; later we'll switch to SSE (text/event-stream) or JSONL tokens depending on frontend choice.
- The new forward route is intentionally minimal and currently treats unknown PROVIDER values as the stub provider. This makes it safe to introduce provider wiring without breaking the app.
- The claws_playground folder is currently a separate git repo (embedded). Be aware clones of the outer repo won't include the inner repo contents unless turned into a submodule. No change made here — we left it as-is.

Next recommended task
- Milestone 2: Model integration (small first step)
  - Implement provider wiring and keep the code low-risk by using an env-driven abstraction.
  - Next run's target (small, focused): Update the client UI to optionally call `/api/chat/forward` instead of `/api/chat`, controlled by a simple flag in the UI or an environment toggle. Acceptance: when the client uses /api/chat/forward, the UI still shows the streamed stubbed response.

Risks / tech debt
- The streaming format is text/plain for now; when integrating real models we'll pick a structured streaming format (SSE or JSONL) and update both server and client.
- The claws_playground folder is currently a separate git repo (embedded). Consider consolidating or making it a submodule if repository boundaries matter.


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
