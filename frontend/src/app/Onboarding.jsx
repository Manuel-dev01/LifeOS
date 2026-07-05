import { useState, useRef, useEffect } from 'react'
import Logo, { Wordmark } from '../components/Logo'
import BrandIcon from '../components/BrandIcon'
import AddMemory from './AddMemory'
import { improveMemory, getDatasets, getConnectors, connectUrl } from '../api'

// key = the /connectors card key; provider = which OAuth flow to start.
const SOURCES = [
  { key: 'gmail', provider: 'google', name: 'Gmail', detail: 'emails' },
  { key: 'calendar', provider: 'google', name: 'Calendar', detail: 'events' },
  { key: 'drive', provider: 'google', name: 'Drive', detail: 'docs' },
  { key: 'notion', provider: 'notion', name: 'Notion', detail: 'pages' },
  { key: 'slack', provider: 'slack', name: 'Slack', detail: 'messages' },
  { key: 'apple_notes', provider: null, name: 'Apple Notes', detail: 'import file' },
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
  const [conn, setConn] = useState({})
  const [importOpen, setImportOpen] = useState(false)
  const timer = useRef(null)
  const importRef = useRef(null)

  const loadConnectors = () =>
    getConnectors()
      .then(({ data }) => setConn(data))
      .catch(() => {})

  useEffect(() => {
    loadConnectors()
  }, [])

  const handleConnect = (src) => {
    if (!src.provider) {
      // apple_notes has no API -> open the file-import panel and scroll to it
      setImportOpen(true)
      requestAnimationFrame(() => importRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    const state = conn[src.key]
    if (state && !state.configured) return // setup required
    // full-page redirect into the backend OAuth flow
    window.location.href = connectUrl(src.provider)
  }

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
      /* still advance; build is best-effort */
    } finally {
      clearInterval(timer.current)
      setPct(100)
      setTimeout(() => setStep(2), 650)
    }
  }

  return (
    <div className="absolute inset-0 z-40 bg-ink text-mist overflow-y-auto">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-5">
        <div className="flex items-center gap-2.5">
          <Logo size={24} />
          <Wordmark className="text-[17px]" />
        </div>
        <div className="hidden sm:flex gap-5 font-mono text-[11px] tracking-[0.14em]">
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
            <h1 className="text-[28px] md:text-[36px] font-bold tracking-[-0.03em] mb-2">
              Connect your memory sources
            </h1>
            <p className="text-[16px] text-[#b9bece] mb-8 max-w-xl">
              Connect an account and LifeOS reads it once, then keeps itself in sync.
              Nothing is shared or used to train shared models.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {SOURCES.map((s) => {
                const state = conn[s.key] || {}
                const connected = !!state.connected
                const needsSetup = s.provider && !state.configured
                const status = s.provider === null
                  ? 'import file'
                  : connected
                  ? 'Connected'
                  : needsSetup
                  ? 'Setup required'
                  : 'Connect'
                return (
                  <button
                    key={s.key}
                    onClick={() => handleConnect(s)}
                    disabled={needsSetup}
                    className={`text-left rounded-2xl border p-4 transition ${
                      connected
                        ? 'border-lavender/40 bg-[#151824]'
                        : needsSetup
                        ? 'border-white/[0.06] bg-ink-card opacity-60 cursor-not-allowed'
                        : 'border-white/[0.1] bg-[#151824] hover:border-lavender/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <BrandIcon name={s.key} size={22} tile />

                      {connected && (
                        <span className="h-5 w-5 rounded-full bg-lavender/20 text-lavender flex items-center justify-center text-[11px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-[14px] font-medium">{s.name}</div>
                    <div className={`font-mono text-[11px] ${connected ? 'text-lavender' : 'text-muted'}`}>
                      {status}
                    </div>
                  </button>
                )
              })}
            </div>

            <details
              ref={importRef}
              open={importOpen}
              onToggle={(e) => setImportOpen(e.target.open)}
              className="mb-8"
            >
              <summary className="cursor-pointer text-[13px] text-lavender mb-3">
                + Import a file instead (PDF, doc, calendar)
              </summary>
              <div className="mt-3">
                <AddMemory dark onDone={loadConnectors} />
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
              Ask it anything. It remembers so you don't have to.
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
