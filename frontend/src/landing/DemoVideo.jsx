import { useEffect, useRef, useState } from 'react'

// A looping "watch it recall" demo: types a question, walks a mini-graph, then
// streams an answer with fading source rows. Driven by one rAF loop reading
// elapsed time (loops every 11s) to avoid re-render churn.
const QUESTION = 'When did I agree to the Q3 pricing change, and with who?'
const ANSWER =
  'You agreed to a 12% price uplift, effective Q3, in the Pricing sync with Dana on Mar 15 — confirmed in your decision log that evening.'
const LOOP = 11000

const NODES = [
  { id: 'q', x: 150, y: 30, label: 'QUESTION', color: '#8b86ff' },
  { id: 'email', x: 70, y: 130, label: 'Email', color: '#6E68FF' },
  { id: 'note', x: 230, y: 130, label: 'Note', color: '#d9a24a' },
  { id: 'meeting', x: 150, y: 210, label: 'Meeting', color: '#5cbf9a' },
  { id: 'person', x: 150, y: 290, label: 'Dana', color: '#8b86ff' },
  { id: 'answer', x: 150, y: 350, label: 'ANSWER', color: '#8b86ff' },
]
const EDGES = [
  ['q', 'email'],
  ['q', 'note'],
  ['email', 'meeting'],
  ['note', 'meeting'],
  ['meeting', 'person'],
  ['person', 'answer'],
]
const LIT_ORDER = { email: 2850, note: 3050, meeting: 3250, person: 3550, answer: 3800 }

export default function DemoVideo() {
  const [t, setT] = useState(0)
  const raf = useRef()
  const start = useRef(null)

  useEffect(() => {
    const loop = (now) => {
      if (start.current == null) start.current = now
      setT((now - start.current) % LOOP)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  // derived animation state
  const typedLen = Math.max(0, Math.min(QUESTION.length, Math.floor((t - 500) / 40)))
  const typedQ = QUESTION.slice(0, typedLen)
  const walking = t > 2650 && t < 3800
  const answerLen =
    t > 3800 ? Math.min(ANSWER.length, Math.floor(((t - 3800) / 2400) * ANSWER.length)) : 0
  const answer = ANSWER.slice(0, answerLen)
  const progress = Math.min(100, Math.round((t / LOOP) * 100))
  const isLit = (id) => t >= (LIT_ORDER[id] || Infinity)

  return (
    <section
      className="px-6 md:px-[6vw] py-[130px]"
      style={{ background: 'linear-gradient(180deg,#0B0D12,#0e1020 50%,#0B0D12)' }}
    >
      <div className="max-w-3xl mx-auto text-center mb-12 revl">
        <div className="font-mono text-[12px] tracking-[0.18em] text-lavender mb-4">
          02 — SEE IT RECALL
        </div>
        <h2
          className="font-sora font-bold text-mist-bright"
          style={{ fontSize: 'clamp(32px,3.6vw,52px)', lineHeight: 1.02, letterSpacing: '-0.035em' }}
        >
          Watch a memory
          <br />
          get walked, live.
        </h2>
      </div>

      {/* browser chrome */}
      <div
        className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/[0.08] revl"
        style={{
          background: '#12141c',
          boxShadow:
            '0 50px 120px -40px rgba(0,0,0,0.9), 0 0 80px -40px rgba(74,68,230,0.5)',
        }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <div className="ml-4 flex-1 text-center font-mono text-[11px] text-[#6b7180]">
            app.lifeos.ai/ask
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b6b] animate-pulseGlow" />
            <span className="font-mono text-[10px] text-[#ff6b6b]">LIVE</span>
          </div>
        </div>

        <div className="grid md:grid-cols-[1.35fr_1fr]">
          {/* chat */}
          <div className="p-7 min-h-[380px] border-r border-white/[0.06]">
            <div className="flex justify-end mb-4">
              <div className="max-w-sm rounded-2xl bg-brand text-white px-4 py-2.5 text-[14px]">
                {typedQ || '…'}
              </div>
            </div>
            {walking && (
              <div className="flex items-center gap-2 text-[#8890a2] text-[13px] mb-3">
                <span className="flex gap-1">
                  <Dot /> <Dot d="0.15s" /> <Dot d="0.3s" />
                </span>
                walking the graph…
              </div>
            )}
            {answer && (
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 text-[14px] leading-relaxed text-mist">
                {answer}
              </div>
            )}
          </div>

          {/* mini graph */}
          <div className="p-5 flex flex-col items-center justify-center">
            <svg viewBox="0 0 300 372" className="w-full max-w-[260px]">
              {EDGES.map(([a, b], i) => {
                const na = NODES.find((n) => n.id === a)
                const nb = NODES.find((n) => n.id === b)
                const lit = isLit(a) && isLit(b)
                return (
                  <line
                    key={i}
                    x1={na.x}
                    y1={na.y}
                    x2={nb.x}
                    y2={nb.y}
                    stroke={lit ? 'rgba(139,134,255,0.75)' : 'rgba(120,124,180,0.22)'}
                    strokeWidth="1.4"
                  />
                )
              })}
              {NODES.map((n) => {
                const lit = n.id === 'q' || isLit(n.id)
                return (
                  <g key={n.id} opacity={lit ? 1 : 0.16}>
                    <circle cx={n.x} cy={n.y} r={n.id === 'q' || n.id === 'answer' ? 7 : 9} fill={n.color} />
                    <text
                      x={n.x}
                      y={n.y - 14}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="'IBM Plex Mono', monospace"
                      fill="#aab0c0"
                    >
                      {n.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* scrubber */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-white/[0.06]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#8b86ff">
            <path d="M8 5v14l11-7z" />
          </svg>
          <div className="flex-1 h-1 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg,#6E68FF,#8b86ff)',
              }}
            />
          </div>
          <span className="font-mono text-[10px] text-[#6b7180]">↻ LOOP</span>
        </div>
      </div>
    </section>
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
