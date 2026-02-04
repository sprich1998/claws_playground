import { NextResponse } from 'next/server'
import { getProviderName, getChatStreamForProvider, getProviderStatus } from '@/src/lib/provider'

function makeRequestId() {
  // simple request id: timestamp-randhex
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xfffff).toString(16)}`
}

export async function POST(req: Request) {
  try {
    // Support optional streaming format via query: ?format=sse
    const url = new URL(req.url)
    const format = url.searchParams.get('format') || ''

    const { message } = await req.json()
    const provider = getProviderName()

    const status = getProviderStatus(provider)
    const providerStream = getChatStreamForProvider(provider, message || '')

    const requestId = makeRequestId()

    const extraHeaders: Record<string, string> = {
      'X-Provider': provider,
      'X-Request-Id': requestId,
      'Cache-Control': 'no-cache',
    }

    if (status.status === 'error') {
      extraHeaders['X-Provider-Status'] = 'error'
      if (status.reason) extraHeaders['X-Provider-Status-Reason'] = status.reason
    } else {
      extraHeaders['X-Provider-Status'] = 'ok'
    }

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
          Connection: 'keep-alive',
          ...extraHeaders,
        }
      })
    }

    // Default: return raw text stream
    return new Response(providerStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...extraHeaders,
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
