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

// Small helper: stream an immediate error message and close.
function createErrorStream(message: string) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`ERROR: ${message}`))
      controller.close()
    }
  })
}

// Minimal OpenAI provider handling (non-functional placeholder):
// - If OPENAI_API_KEY is missing, return a short error stream explaining what's needed.
// - If the key exists, return a small informational stream. Real integration will replace this.
function createOpenAIStream(message: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return createErrorStream('OPENAI_API_KEY is not set in environment. Set it to enable OpenAI provider.')
  }

  // For safety we don't call external APIs here. Emit a short notice that the provider is recognized.
  const encoder = new TextEncoder()
  const parts = [
    `OpenAI provider selected. Forwarding message: ${message}`,
    '\n\nNote: OpenAI integration is not implemented in this repo. Implement a provider function that calls the OpenAI API and streams tokens back here.',
  ]

  return new ReadableStream({
    start(controller) {
      let i = 0
      const sendNext = () => {
        if (i >= parts.length) {
          controller.close()
          return
        }
        controller.enqueue(encoder.encode(parts[i]))
        i++
        setTimeout(sendNext, 200)
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

  if (provider === 'openai') {
    return createOpenAIStream(message)
  }

  // Default fallback: treat unknown providers as stub for now
  return createStubStream(message)
}
