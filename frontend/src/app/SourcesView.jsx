import { useState, useEffect } from 'react'
import { forgetDataset, getConnectors, connectUrl, syncConnector } from '../api'
import ViewHeader from './ViewHeader'
import BrandIcon from '../components/BrandIcon'
import AddMemory from './AddMemory'

const CONNECTORS = [
  { key: 'gmail', provider: 'google', name: 'Gmail' },
  { key: 'calendar', provider: 'google', name: 'Calendar' },
  { key: 'drive', provider: 'google', name: 'Drive' },
  { key: 'notion', provider: 'notion', name: 'Notion' },
  { key: 'slack', provider: 'slack', name: 'Slack' },
]

export default function SourcesView({ datasets, onChange }) {
  const [busy, setBusy] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [conn, setConn] = useState({})
  const [err, setErr] = useState('')

  useEffect(() => {
    getConnectors().then(({ data }) => setConn(data)).catch(() => {})
  }, [])

  const errMsg = (e) => e?.response?.data?.detail || e?.message || 'Something went wrong'

  const sync = async (key) => {
    setBusy(`sync-${key}`)
    setErr('')
    try {
      await syncConnector(key)
      onChange()
    } catch (e) {
      setErr(`Sync failed: ${errMsg(e)}`)
    } finally {
      setBusy(null)
    }
  }

  const forget = async (name) => {
    if (!confirm(`Forget "${name}"? This permanently deletes those memories.`)) return
    setBusy(name)
    setErr('')
    try {
      await forgetDataset(name)
      onChange()
    } catch (e) {
      setErr(`Forget failed: ${errMsg(e)}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <ViewHeader
        title="Sources"
        subtitle="what LifeOS reads · kept in sync automatically"
        right={
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="text-[13px] px-4 py-2 rounded-full bg-brand text-white hover:brightness-110 transition"
          >
            + Add memory
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {err && (
            <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 text-danger text-[13px] px-4 py-2.5 flex items-center justify-between">
              <span>{err}</span>
              <button onClick={() => setErr('')} className="text-danger/70 hover:text-danger">✕</button>
            </div>
          )}
          {showAdd && (
            <div className="mb-6">
              <AddMemory
                onDone={() => {
                  setShowAdd(false)
                  onChange()
                }}
              />
            </div>
          )}

          {/* Connect accounts */}
          <div className="mb-6">
            <div className="font-mono text-[10px] tracking-[0.14em] text-[#9aa3b2] mb-2">
              CONNECT ACCOUNTS
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CONNECTORS.map((c) => {
                const state = conn[c.key] || {}
                const connected = !!state.connected
                const needsSetup = !state.configured
                return (
                  <div
                    key={c.key}
                    className="flex items-center gap-2.5 rounded-xl bg-white border border-[#eceef3] px-3 py-2.5"
                  >
                    <BrandIcon name={c.key} size={18} tile />

                    <span className="text-[13px] font-medium text-ink-900 flex-1">{c.name}</span>
                    {connected ? (
                      <button
                        onClick={() => sync(c.key)}
                        disabled={busy === `sync-${c.key}`}
                        className="text-[11px] text-brand hover:underline disabled:opacity-40"
                      >
                        {busy === `sync-${c.key}` ? 'Syncing…' : 'Sync'}
                      </button>
                    ) : needsSetup ? (
                      <span className="font-mono text-[10px] text-[#9aa3b2]">Setup req.</span>
                    ) : (
                      <a
                        href={connectUrl(c.provider)}
                        className="text-[11px] text-brand hover:underline"
                      >
                        Connect
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {datasets.length === 0 && (
            <div className="text-[#8b90a0] text-sm">
              No sources yet. Add your first memory above.
            </div>
          )}

          <div className="space-y-2">
            {datasets.map((d) => (
              <div
                key={d.id || d.name}
                className="flex items-center gap-4 rounded-xl bg-white border border-[#eceef3] px-4 py-3.5"
              >
                <div className="h-9 w-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-semibold uppercase">
                  {(d.name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-ink-900 truncate">{d.name}</div>
                  <div className="font-mono text-[11px] text-[#9aa3b2]">memory vault</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-meeting" />
                  <span className="font-mono text-[11px] text-[#9aa3b2]">Synced</span>
                </div>
                <button
                  onClick={() => forget(d.name)}
                  disabled={busy === d.name}
                  className="text-[12px] text-danger hover:underline disabled:opacity-40 ml-2"
                >
                  {busy === d.name ? '…' : 'Forget'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
