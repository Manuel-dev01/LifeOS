import { useState, useRef } from 'react'
import Logo, { Wordmark } from '../components/Logo'
import AddMemory from './AddMemory'
import { improveMemory, getDatasets } from '../api'

const SOURCES = [
  { name: 'Gmail', detail: 'emails', connected: true, mark: '#D93025' },
  { name: 'Calendar', detail: 'events', connected: true, mark: '#4A44E6' },
  { name: 'Notion', detail: 'pages', connected: true, mark: '#13151B' },
  { name: 'Slack', detail: 'Connect', connected: false, mark: '#611f69' },
  { name: 'Apple Notes', detail: 'Connect', connected: false, mark: '#c08a34' },
  { name: 'Drive', detail: 'Connect', connected: false, mark: '#4aa3d9' },
]

const BUILD_ROWS = [
  ['Reading your memories', 'parsing sources'],
  ['Linking people & threads', 'building edges'],
  ['Extracting decisions', 'enriching graph'],
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [pct, setPct] = useState(0)
  const [count, setCount] = useState(0)
  const timer = useRef(null)

  const build = async () => {
    setStep(1)
    setPct(0)
    // ease toward 90% while the real improve() runs, snap to 100 on resolve
    timer.current = setInterval(() => {
      setPct((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.08) : p))
    }, 120)
    try {
      await improveMemory()
      const { data } = await getDatasets()
      setCount(data.length)
    } catch {
      /* still advance — build is best-effort */
    } finally {
      clearInterval(timer.current)
      setPct(100)
      setTimeout(() => setStep(2), 650)
    }
  }

  return (
    <div className="absolute inset-0 z-40 bg-ink text-mist overflow-y-auto">
      {/* top bar */}
      <div className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <Logo size={24} />
          <Wordmark className="text-[17px]" />
        </div>
        <div className="flex gap-5 font-mono text-[11px] tracking-[0.14em]">
          {['01 CONNECT', '02 BUILD', '03 READY'].map((s, i) => (
            <span key={s} style={{ color: i === step ? '#8b86ff' : '#565d6b' }}>
              {s}
            </span>
          ))}
        </div>
        <button onClick={onDone} className="text-[12px] text-muted hover:text-mist transition">
          Skip →
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {step === 0 && (
          <div className="animate-fadeUp">
            <div className="font-mono text-[11px] tracking-[0.16em] text-lavender mb-3">STEP 01</div>
            <h1 className="text-[36px] font-bold tracking-[-0.03em] mb-2">
              Connect your memory sources
            </h1>
            <p className="text-[16px] text-[#b9bece] mb-8 max-w-xl">
              Pick what LifeOS should remember, or paste your own below. It reads once, then
              keeps itself in sync. Nothing is shared or used to train shared models.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {SOURCES.map((s) => (
                <div
                  key={s.name}
                  className={`rounded-2xl border p-4 ${
                    s.connected
                      ? 'border-white/[0.1] bg-[#151824]'
                      : 'border-white/[0.06] bg-ink-card opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-[13px] font-bold" style={{ background: s.mark }}>
                      {s.name[0]}
                    </span>
                    {s.connected && (
                      <span className="h-5 w-5 rounded-full bg-lavender/20 text-lavender flex items-center justify-center text-[11px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[14px] font-medium">{s.name}</div>
                  <div className="font-mono text-[11px] text-muted">{s.detail}</div>
                </div>
              ))}
            </div>

            <details className="mb-8">
              <summary className="cursor-pointer text-[13px] text-lavender mb-3">
                + Paste your own memory (email, note, calendar)
              </summary>
              <div className="mt-3">
                <AddMemory dark />
              </div>
            </details>

            <button
              onClick={build}
              className="rounded-full bg-brand text-white font-medium px-7 py-3.5 hover:brightness-110 transition"
              style={{ boxShadow: '0 16px 40px -12px rgba(74,68,230,0.7)' }}
            >
              Build my memory graph →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fadeUp flex flex-col items-center text-center py-10">
            <div className="relative h-28 w-28 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-white/[0.08]" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-lavender animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[22px]">
                {Math.round(pct)}%
              </div>
            </div>
            <h1 className="text-[30px] font-bold tracking-[-0.03em] mb-1">Weaving your graph</h1>
            <p className="font-mono text-[12px] text-muted mb-8">
              Extracting entities, decisions and connections…
            </p>
            <div className="w-full max-w-sm space-y-2">
              {BUILD_ROWS.map(([label, sub], i) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3"
                  style={{ opacity: pct > i * 30 ? 1 : 0.4 }}
                >
                  <span className="text-[14px]">{label}</span>
                  <span className="font-mono text-[11px] text-lavender">
                    {pct > (i + 1) * 30 ? 'done' : sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fadeUp flex flex-col items-center text-center py-16">
            <div className="h-20 w-20 rounded-full bg-meeting/20 text-meeting flex items-center justify-center text-[32px] mb-6">
              ✓
            </div>
            <h1 className="text-[32px] font-bold tracking-[-0.03em] mb-2">Your memory is ready</h1>
            <p className="text-[16px] text-[#b9bece] mb-8 max-w-md">
              {count > 0
                ? `${count} memory vault${count === 1 ? '' : 's'}, connected into one graph. `
                : ''}
              Ask it anything — it remembers so you don't have to.
            </p>
            <button
              onClick={onDone}
              className="rounded-full bg-brand text-white font-medium px-7 py-3.5 hover:brightness-110 transition"
              style={{ boxShadow: '0 16px 40px -12px rgba(74,68,230,0.7)' }}
            >
              Enter LifeOS →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
