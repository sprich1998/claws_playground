import { NextResponse } from 'next/server'
import { getProviderName, getChatStreamForProvider } from '@/src/lib/provider'

export async function POST(req: Request) {
  try {
    // Support optional streaming format via query: ?format=sse
    const url = new URL(req.url)
    const format = url.searchParams.get('format') || ''

    const { message } = await req.json()
    const provider = getProviderName()

    const providerStream = getChatStreamForProvider(provider, message || '')

    // If SSE format requested, wrap provider stream into Server-Sent Events framing.
    if (format.toLowerCase() === 'sse') {
      const encoder = new TextEncoder()
      const dec = new TextDecoder()

      const sseStream = new ReadableStream({
        async start(controller) {
          const reader = providerStream.getReader()
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const text = dec.decode(value)
              // Ensure multiline chunks are prefixed correctly per SSE spec
              const ssePayload = text
                .split('\n')
                .map((line) => `data: ${line}`)
                .join('\n') + "\n\n"

              controller.enqueue(encoder.encode(ssePayload))
            }
            controller.close()
          } catch (e: any) {
            controller.enqueue(encoder.encode(`event: error\ndata: ${String(e?.message || e)}\n\n`))
            controller.close()
          }
        }
      })

      return new Response(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Provider': provider,
        }
      })
    }

    // Default: return raw text stream
    return new Response(providerStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Provider': provider,
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
