# Contributing

Quickstart

1. Copy the example env file and fill any secrets you want to test locally:

   cp .env.example .env

   WARNING: Do NOT commit .env or any secrets.

2. Install dependencies:

   npm install

3. Start the dev server:

   npm run dev

4. Run smoke tests (in a separate terminal):

   node scripts/smoke-chat.js
   node scripts/smoke-forward.js

What the smoke tests do

- smoke-chat.js posts to /api/chat and prints streamed chunks as they arrive.
- smoke-forward.js posts to /api/chat/forward and prints streamed chunks and the X-Provider header.

Provider notes

- The app uses a provider abstraction. By default PROVIDER=stub (see .env.example).
- To test an OpenAI provider you must set OPENAI_API_KEY in your .env and implement the provider integration.

Development tips

- The forward route supports an SSE-style framing mode: POST /api/chat/forward?format=sse
- Use curl -N to see chunks as they arrive when testing from the terminal.

CI suggestions

- Add a CI job that starts the dev server and runs the smoke tests to ensure streaming behavior remains working.
