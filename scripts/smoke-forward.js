// Smoke test for the forwarding streaming chat endpoint
// Usage: node scripts/smoke-forward.js
// Requires Node 18+ (global fetch + streams)

const url = 'http://localhost:3000/api/chat/forward'
const message = process.argv[2] || 'Hello from smoke-forward test!'

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

  console.log('Streaming response:')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    process.stdout.write(chunk)
  }

  console.log('\n-- stream ended --')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
