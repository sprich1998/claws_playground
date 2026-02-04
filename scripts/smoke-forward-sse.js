// Smoke test for the forwarding SSE streaming chat endpoint
// Usage: node scripts/smoke-forward-sse.js
// Requires Node 18+ (global fetch + streams)

const url = 'http://localhost:3000/api/chat/forward?format=sse'
const message = process.argv[2] || 'Hello from smoke-forward-sse test!'

async function run() {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })

  if (!res.ok) {
    console.error('Request failed', res.status)
    process.exit(1)
  }

  console.log('Provider:', res.headers.get('x-provider'))
  console.log('X-Request-Id:', res.headers.get('x-request-id'))

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  console.log('Streaming SSE response (raw events):')

  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Process complete SSE events separated by double-newline
    let idx
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, idx).trim()
      buffer = buffer.slice(idx + 2)
      if (!rawEvent) continue

      // Print the raw event and also parse data: lines
      console.log('--- EVENT START ---')
      console.log(rawEvent)

      // Extract data lines
      const dataLines = rawEvent.split('\n').filter((l) => l.startsWith('data:'))
      if (dataLines.length) {
        const payload = dataLines.map((l) => l.replace(/^data:\s?/, '')).join('\n')
        console.log('\nParsed payload:\n' + payload)
      }

      console.log('---- EVENT END ----\n')
    }
  }

  // Flush remaining buffer if any
  if (buffer.trim()) {
    console.log('Remaining buffer:\n', buffer)
  }

  console.log('\n-- stream ended --')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
