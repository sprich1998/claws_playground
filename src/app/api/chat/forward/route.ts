import { NextResponse } from 'next/server'
import { getProviderName, getChatStreamForProvider } from '@/src/lib/provider'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    const provider = getProviderName()

    const stream = getChatStreamForProvider(provider, message || '')

    return new Response(stream, {
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
