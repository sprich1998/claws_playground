import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

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
