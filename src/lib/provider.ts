export type ProviderName = 'stub' | string

export function getProviderName(): ProviderName {
  return (process.env.PROVIDER as ProviderName) || 'stub'
}

// Create a simple stubbed ReadableStream that emits chunks like a model stream.
export function createStubStream(message: string) {
  const encoder = new TextEncoder()

  const replyParts = [
    `Forwarded (stub) echo: ${message}`,
    '\n\nThis response comes from the "forward" route using PROVIDER=stub.',
    '\n\n(Replace provider implementation to connect to real model APIs.)'
  ]

  return new ReadableStream({
    start(controller) {
      let i = 0
      const sendNext = () => {
        if (i >= replyParts.length) {
          controller.close()
          return
        }
        controller.enqueue(encoder.encode(replyParts[i]))
        i++
        setTimeout(sendNext, 250)
      }
      sendNext()
    }
  })
}

// Abstraction: given provider name and message, return a Response body (ReadableStream)
export function getChatStreamForProvider(provider: ProviderName, message: string) {
  if (provider === 'stub') {
    return createStubStream(message)
  }

  // Default fallback: treat unknown providers as stub for now
  return createStubStream(message)
}
