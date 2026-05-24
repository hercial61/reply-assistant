"use client"

import { useState, useRef } from "react"

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "empathetic", label: "Empathetic" },
  { value: "concise", label: "Concise" },
]

export default function ReplyPage() {
  const [customerMessage, setCustomerMessage] = useState("")
  const [tone, setTone] = useState("professional")
  const [draft, setDraft] = useState("")
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const draftRef = useRef<HTMLTextAreaElement>(null)

  async function handleDraft() {
    if (!customerMessage.trim()) return
    setDrafting(true)
    setError("")
    setDraft("")
    try {
      const res = await fetch("/api/ai/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerMessage: customerMessage.trim(), tone }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to generate draft")
        return
      }
      const data = await res.json()
      setDraft(data.draft)
      setTimeout(() => draftRef.current?.focus(), 50)
    } catch {
      setError("Failed to generate draft")
    } finally {
      setDrafting(false)
    }
  }

  async function handleCopy() {
    if (!draft) return
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleNewReply() {
    setCustomerMessage("")
    setDraft("")
    setError("")
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
        <span className="text-sm font-medium text-zinc-900">Draft a reply</span>
        {draft && (
          <button onClick={handleNewReply} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 h-full divide-x divide-zinc-200">
          {/* Left: customer message + controls */}
          <div className="flex flex-col p-6 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Customer message
              </label>
              <textarea
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                placeholder="Paste the customer email, complaint, or message here…"
                autoFocus
                className="w-full flex-1 resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 min-h-64"
                rows={12}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      tone === t.value
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleDraft}
              disabled={drafting || !customerMessage.trim()}
              className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {drafting ? "Drafting…" : "✦ Draft reply"}
            </button>
          </div>

          {/* Right: draft output */}
          <div className="flex flex-col p-6 gap-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Draft reply
              </label>
              {draft && (
                <div className="flex items-center gap-3">
                  {copied && <span className="text-xs text-zinc-400">Copied!</span>}
                  <button
                    onClick={handleCopy}
                    className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={handleDraft}
                    disabled={drafting}
                    className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-50 transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {draft ? (
              <textarea
                ref={draftRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 w-full resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 min-h-64"
                rows={12}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-zinc-200 min-h-64">
                <p className="text-sm text-zinc-400">
                  {drafting ? "Claude is writing your reply…" : "Your drafted reply will appear here"}
                </p>
              </div>
            )}

            {draft && (
              <button
                onClick={handleCopy}
                className="w-full rounded-md border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
