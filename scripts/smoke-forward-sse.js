// Smoke test for the forwarding streaming chat endpoint in SSE mode
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

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  console.log('Streaming SSE response:')

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Process complete SSE events separated by double newline
    let idx
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)

      // Parse SSE chunk into lines
      const lines = chunk.split('\n')
      const dataLines = lines.filter((l) => l.startsWith('data:'))
      const data = dataLines.map((l) => l.replace(/^data:\s?/, '')).join('\n')
      if (data) process.stdout.write(data + '\n')

      // handle event: error lines if present
      const eventLine = lines.find((l) => l.startsWith('event:'))
      if (eventLine) {
        const ev = eventLine.replace(/^event:\s?/, '')
        console.log(`[event: ${ev}]`)
      }
    }
  }

  // flush any trailing buffered text
  if (buffer.trim()) {
    // Try to parse remaining as SSE (best-effort)
    const lines = buffer.split('\n')
    const dataLines = lines.filter((l) => l.startsWith('data:'))
    const data = dataLines.map((l) => l.replace(/^data:\s?/, '')).join('\n')
    if (data) process.stdout.write(data + '\n')
  }

  console.log('\n-- stream ended --')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
