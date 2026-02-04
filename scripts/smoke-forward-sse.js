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
  console.log('Streaming SSE response:')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })

    // SSE events are separated by double-newline
    const parts = buf.split('\n\n')
    // Keep the last partial part in buffer
    buf = parts.pop() || ''

    for (const part of parts) {
      if (!part.trim()) continue
      // Print the raw event block
      console.log('--- event ---')
      console.log(part)

      // Simple parsing: print data: lines combined
      const dataLines = part.split('\n').filter((l) => l.startsWith('data:'))
      if (dataLines.length) {
        const data = dataLines.map((l) => l.replace(/^data:\s?/, '')).join('\n')
        console.log('data:', data)
      }
    }
  }

  // Flush any trailing buffer
  if (buf.trim()) {
    console.log('--- final partial event ---')
    console.log(buf)
  }

  console.log('\n-- stream ended --')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
