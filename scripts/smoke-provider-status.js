// Smoke test for provider status endpoint
// Usage: node scripts/smoke-provider-status.js

const url = 'http://localhost:3000/api/provider/status'

async function run() {
  const res = await fetch(url)
  if (!res.ok) {
    console.error('Request failed', res.status)
    process.exit(1)
  }
  const json = await res.json()
  console.log('Provider status:', JSON.stringify(json, null, 2))
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
