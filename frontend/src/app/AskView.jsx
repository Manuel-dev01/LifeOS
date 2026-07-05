import { useState, useRef, useEffect } from 'react'
import { queryMemory } from '../api'
import Markdown from '../components/Markdown'
import RecallRail from './RecallRail'
import Logo from '../components/Logo'

const SUGGESTIONS = [
  'What was the final agreed marketing budget?',
  'Who was responsible for influencer campaigns?',
  'Where was the budget meeting held?',
]

const SOURCE_COLORS = { email: '#6E68FF', meeting: '#5cbf9a', note: '#d9a24a', upload: '#8b86ff' }

export default function AskView({ onOpenGraph }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const lastSources = messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.sources || []

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const ask = async (q) => {
    const question = (q ?? input).trim()
    if (!question || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: question }])
    setLoading(true)
    try {
      const { data } = await queryMemory(question, false)
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.answer, sources: data.sources || [] },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Something went wrong reaching your memory.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#e2e4ea]">
        <div>
          <h1 className="text-[20px] font-semibold">Ask LifeOS</h1>
          <p className="font-mono text-[11px] text-[#9aa3b2] mt-0.5">
            walks your memory graph · cites every source
          </p>
        </div>
        <div className="flex gap-2">
          <span className="font-mono text-[11px] px-3 py-1.5 rounded-full bg-[#eef0f4] text-[#565d6b]">
            All sources
          </span>
          <span className="font-mono text-[11px] px-3 py-1.5 rounded-full bg-[#eef0f4] text-[#565d6b]">
            Any time
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-[1fr_320px]">
        {/* conversation + composer */}
        <div className="flex flex-col min-h-0 border-r border-[#e2e4ea]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Logo size={40} />
                <h2 className="text-[18px] font-semibold mt-4 mb-1">Ask your memory anything</h2>
                <p className="text-[14px] text-[#8b90a0] max-w-sm mb-6">
                  Every answer is walked from your real emails, meetings and notes, and cited.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="text-[12px] px-3 py-1.5 rounded-full border border-[#e2e4ea] text-[#565d6b] hover:border-brand hover:text-brand transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <Message key={i} m={m} onOpenGraph={onOpenGraph} />
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-[#8b90a0] text-[13px]">
                <span className="flex gap-1">
                  <Dot /> <Dot d="0.15s" /> <Dot d="0.3s" />
                </span>
                walking the graph…
              </div>
            )}
          </div>

          <div className="border-t border-[#e2e4ea] p-4">
            <div className="flex items-center gap-2 max-w-3xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask()}
                placeholder="Ask anything about your life…"
                className="flex-1 bg-white border border-[#d7dae2] rounded-2xl px-4 py-3 text-[14px] text-ink-900 placeholder-[#9aa3b2] focus:outline-none focus:border-brand"
              />
              <span className="font-mono text-[10px] text-[#9aa3b2] hidden sm:block">walks the graph</span>
              <button
                onClick={() => ask()}
                disabled={loading || !input.trim()}
                className="h-11 w-11 rounded-xl bg-brand text-white flex items-center justify-center hover:brightness-110 disabled:opacity-40 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* recall rail */}
        <div className="p-4 bg-ink-side">
          <RecallRail loading={loading} done={!loading && lastSources.length > 0} sourceCount={lastSources.length} />
        </div>
      </div>
    </div>
  )
}

function Message({ m, onOpenGraph }) {
  const [showSources, setShowSources] = useState(true)
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-lg bg-ink-900 text-mist px-4 py-2.5 text-[14px]"
          style={{ borderRadius: '16px 16px 4px 16px' }}
        >
          {m.content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div
        className={`max-w-2xl bg-white border p-5 ${m.error ? 'border-[#f6d4d4]' : 'border-[#eceef3]'}`}
        style={{ borderRadius: '4px 16px 16px 16px', boxShadow: '0 20px 50px -30px rgba(19,21,27,0.3)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Logo size={18} darkCenters />
          <span className="font-mono text-[10px] tracking-[0.14em] text-[#9aa3b2]">
            {m.error ? 'ERROR' : `RECALLED FROM ${m.sources?.length || 0} SOURCE${(m.sources?.length || 0) === 1 ? '' : 'S'}`}
          </span>
        </div>
        <div className="text-[15px] text-ink-900">
          <Markdown text={m.content} />
        </div>

        {m.sources?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#eef0f4]">
            <button
              onClick={() => setShowSources((s) => !s)}
              className="font-mono text-[10px] tracking-[0.14em] text-[#9aa3b2] hover:text-brand"
            >
              SOURCES · {showSources ? 'HIDE' : 'SHOW'}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2">
                {m.sources.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span
                      className="mt-1 h-2 w-2 rounded-sm shrink-0"
                      style={{ background: SOURCE_COLORS[String(s.source).split(',')[0].trim()] || '#8b86ff' }}
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] text-[#9aa3b2] uppercase">{s.source}</div>
                      <div className="text-[13px] text-[#565d6b]">
                        <Markdown text={s.text} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={onOpenGraph}
              className="mt-3 text-[12px] text-brand hover:underline"
            >
              See how it connected →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Dot({ d = '0s' }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-lavender animate-pulseGlow"
      style={{ animationDelay: d }}
    />
  )
}
