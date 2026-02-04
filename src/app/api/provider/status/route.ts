import { NextResponse } from 'next/server'
import { getProviderName, getProviderStatus } from '@/src/lib/provider'

export async function GET() {
  try {
    const provider = getProviderName()
    const status = getProviderStatus(provider)

    return NextResponse.json({ provider, status }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Unable to determine provider status' }, { status: 500 })
  }
}
