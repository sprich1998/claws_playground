"use client"

import Image from "next/image";
import { FormEvent, useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<'direct' | 'forward'>('direct')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");

    try {
      setStreaming(true);
      const endpoint = mode === 'forward' ? '/api/chat/forward' : '/api/chat'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      })

      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => 'error')
        setMessages((m) => [...m, { role: 'assistant', text: `Error: ${err}` }])
        setStreaming(false)
        return
      }

      // Optionally read provider header if present (only available before streaming starts)
      try {
        const provider = res.headers?.get('x-provider')
        if (provider) {
          setMessages((m) => [...m, { role: 'assistant', text: `(provider: ${provider})\n` }])
        }
      } catch (e) {
        // ignore
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()

      // Start a new assistant message and append chunks as they arrive
      setMessages((m) => [...m, { role: 'assistant', text: '' }])

      let done = false
      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) {
          const chunk = dec.decode(value)
          setMessages((m) => {
            // append to the last message (assistant)
            const next = [...m]
            const last = next[next.length - 1]
            if (last && last.role === 'assistant') {
              last.text = last.text + chunk
            } else {
              next.push({ role: 'assistant', text: chunk })
            }
            return next
          })
        }
      }
    } catch (err) {
      console.error(err)
      setMessages((m) => [...m, { role: 'assistant', text: 'Request failed' }])
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-stretch bg-white px-6 py-8 sm:rounded-lg sm:shadow-md dark:bg-[#0b0b0b]">
        <header className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <Image src="/next.svg" alt="logo" width={80} height={20} className="dark:invert" />
          <h1 className="text-lg font-semibold">Personal Assistant</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-sm text-zinc-500">Streaming demo</div>
            <label className="text-xs text-zinc-500 flex items-center gap-2">
              <span className="mr-1">Endpoint:</span>
              <select value={mode} onChange={(e) => setMode(e.target.value as 'direct' | 'forward') } className="rounded border bg-white text-xs px-2 py-1">
                <option value="direct">/api/chat</option>
                <option value="forward">/api/chat/forward</option>
              </select>
            </label>
          </div>
        </header>

        <section className="flex-1 overflow-auto px-2 py-6" style={{ minHeight: 300 }}>
          <div className="flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="text-center text-zinc-500">Send a message to start the conversation.</div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] p-3 rounded-md ${m.role === "user" ? "self-end bg-blue-600 text-white" : "self-start bg-zinc-100 text-zinc-900"}`}>
                <pre className="whitespace-pre-wrap">{m.text}</pre>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={streaming ? "Waiting for response..." : "Type a message..."}
            className="flex-1 rounded-md border border-zinc-200 px-3 py-2 focus:outline-none"
            disabled={streaming}
          />
          <button type="submit" disabled={streaming} className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50">
            {streaming ? "Streaming..." : "Send"}
          </button>
        </form>

        <footer className="mt-4 text-xs text-zinc-500">Tip: run the included smoke test scripts while the dev server is running: node scripts/smoke-chat.js or node scripts/smoke-forward.js</footer>
      </main>
    </div>
  );
}
