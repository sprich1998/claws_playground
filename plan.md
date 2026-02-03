# Personal Assistant Web App - Plan

Goal: Build an interactive personal assistant you can talk to directly in the browser, with streaming text responses and optional voice.

## Milestone 1: Basic chat UI (Next.js)
- Replace landing page with a chat interface
- Message list + input box
- Simple agent backend endpoint (/api/chat) that accepts text and returns stubbed replies
- Add streaming via Server-Sent Events (SSE) or fetch + ReadableStream

## Milestone 2: Model integration
- Choose a model API (OpenAI/Claude/local). For now, stub; later add provider env vars
- Create server route that forwards user messages and streams assistant tokens back
- Keep a conversation array (messages: [{role, content, ts}]) in session/local storage

## Milestone 3: Memory & settings
- Preferences panel: model, temperature, persona toggle
- Lightweight memory: save key facts per session; allow clear/reset
- Persist chat history to localStorage (and server-side if desired)

## Milestone 4: Voice
- Microphone input (Web Speech API) for quick dictation
- Text-to-speech (browser TTS first; server TTS later)
- Playback controls

## Milestone 5: Polish
- Responsive design, dark mode
- Keyboard shortcuts (Enter to send, Shift+Enter newline)
- Error states, retry, network indicators

## Future integrations
- OpenClaw gateway for multi-channel messaging
- External tools (weather, calendar) via skills
- Webhooks and background jobs

## Notes
- Keep secrets out of the repo; use env vars
- Make components simple and testable; prefer functional patterns
