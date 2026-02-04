import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
    }

    const payload = await req.json()
    const message = typeof payload?.message === 'string' ? payload.message : ''

    if (!message.trim()) {
      return NextResponse.json({ error: 'Missing or empty "message" field' }, { status: 400 })
    }

    // Create a ReadableStream to stream SSE-like chunks
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        // Simple stubbed reply broken into parts to simulate streaming tokens
        const replyParts = [
          `Echoing: ${message}`,
          '\n\nThis is a streamed stub reply.',
          '\n\n(You can replace this with a real model later.)'
        ]

        let i = 0

        const sendNext = () => {
          if (i >= replyParts.length) {
            // close the stream
            controller.close()
            return
          }

          const chunk = replyParts[i]
          controller.enqueue(encoder.encode(chunk))
          i++

          // Schedule next chunk
          setTimeout(sendNext, 300) // 300ms between chunks
        }

        // Start streaming
        sendNext()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
