// Smoke test for the forwarding streaming chat endpoint using SSE framing
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

  console.log('SSE streaming response:')

  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Process complete lines
    let idx
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim()
      buffer = buffer.slice(idx + 1)
      if (!line) continue
      // SSE lines are like: data: ... or event: ...
      if (line.startsWith('data:')) {
        console.log(line.replace(/^data:\s?/, ''))
      } else if (line.startsWith('event:')) {
        console.log(`[event] ${line.replace(/^event:\s?/, '')}`)
      } else {
        console.log(line)
      }
    }
  }

  // flush remaining buffer
  if (buffer.trim()) {
    console.log(buffer.trim())
  }

  console.log('\n-- stream ended --')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
