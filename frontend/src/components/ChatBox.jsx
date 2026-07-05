import { useState, useRef, useEffect } from 'react'
import { queryMemory } from '../api'
import Markdown from './Markdown'

const SUGGESTIONS = [
  'What was the final agreed marketing budget?',
  'Who was responsible for influencer campaigns?',
  'Where was the budget meeting held?',
  'What were my action items from the sprint retro?',
]

export default function ChatBox({ onGraph, includeGraph }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const ask = async (question) => {
    const q = (question ?? input).trim()
    if (!q || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: q }])
    setLoading(true)
    try {
      const { data } = await queryMemory(q, includeGraph)
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.answer, sources: data.sources || [] },
      ])
      if (data.graph) onGraph?.(data.graph)
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: '⚠️ Something went wrong reaching memory.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">◎</div>
            <h2 className="text-lg font-semibold text-white mb-1">Ask your memory anything</h2>
            <p className="text-sm text-slate-400 max-w-md mb-6">
              LifeOS recalls across every email, meeting, and note you've ever given it —
              connecting the dots you'd otherwise forget.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-vault-border text-slate-300 hover:bg-vault-panel hover:border-vault-accent transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span className="flex gap-1">
              <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
            </span>
            Thinking through your memories…
          </div>
        )}
      </div>

      <div className="border-t border-vault-border p-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            placeholder="Ask about a decision, person, budget, meeting…"
            className="flex-1 bg-vault-panel border border-vault-border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vault-accent"
          />
          <button
            onClick={() => ask()}
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-vault-accent text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-40 transition"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            isUser
              ? 'bg-vault-accent text-white whitespace-pre-wrap'
              : message.error
              ? 'bg-rose-950/50 border border-rose-800 text-rose-200'
              : 'bg-vault-panel border border-vault-border text-slate-100'
          }`}
        >
          {isUser ? message.content : <Markdown text={message.content} />}
        </div>

        {!isUser && message.sources?.length > 0 && (
          <div className="mt-1.5">
            <button
              onClick={() => setShowSources((s) => !s)}
              className="text-[11px] text-vault-accent2 hover:underline"
            >
              {showSources ? 'Hide' : 'Show'} {message.sources.length} source
              {message.sources.length > 1 ? 's' : ''}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((s, i) => (
                  <div
                    key={i}
                    className="text-xs bg-vault-bg/60 border border-vault-border rounded-lg px-3 py-2"
                  >
                    <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                      {s.source}
                    </div>
                    <Markdown text={s.text} className="text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Dot({ delay = '0s' }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-vault-accent2 animate-bounce"
      style={{ animationDelay: delay }}
    />
  )
}
