import { useState } from 'react'
import UploadPanel from './UploadPanel'
import { forgetDataset, improveMemory } from '../api'

export default function Sidebar({ datasets, health, onChange }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleForget = async (name) => {
    if (!confirm(`Forget dataset "${name}"? This permanently deletes those memories.`)) return
    setBusy(true)
    setMsg(null)
    try {
      await forgetDataset(name)
      setMsg({ ok: true, text: `Forgot "${name}"` })
      onChange()
    } catch (e) {
      setMsg({ ok: false, text: `Failed to forget "${name}"` })
    } finally {
      setBusy(false)
    }
  }

  const handleImprove = async () => {
    setBusy(true)
    setMsg(null)
    try {
      await improveMemory()
      setMsg({ ok: true, text: 'Memory improved — graph re-enriched' })
      onChange()
    } catch (e) {
      setMsg({ ok: false, text: 'Improve failed' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="w-80 shrink-0 h-full flex flex-col bg-vault-panel border-r border-vault-border">
      <div className="px-5 py-4 border-b border-vault-border">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              health?.ok ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
          <span className="text-xs text-slate-400">
            {health?.ok ? 'Cognee memory online' : 'Memory offline'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <UploadPanel onIngested={onChange} setMsg={setMsg} />

        <div className="px-5 py-4 border-t border-vault-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Memory Vaults
            </h3>
            <button
              onClick={handleImprove}
              disabled={busy}
              className="text-[11px] px-2 py-1 rounded-md bg-vault-accent/20 text-vault-accent2 border border-vault-accent/40 hover:bg-vault-accent/30 disabled:opacity-50 transition"
              title="Re-run Cognee's improve() to enrich the graph"
            >
              ✨ Improve
            </button>
          </div>

          <ul className="space-y-2">
            {datasets.length === 0 && (
              <li className="text-xs text-slate-500 italic">No memories yet — add some above.</li>
            )}
            {datasets.map((d) => (
              <li
                key={d.id || d.name}
                className="group flex items-center justify-between rounded-lg bg-vault-bg/60 border border-vault-border px-3 py-2"
              >
                <span className="text-sm text-slate-200 truncate">{d.name}</span>
                <button
                  onClick={() => handleForget(d.name)}
                  disabled={busy}
                  className="opacity-60 group-hover:opacity-100 text-rose-400 hover:text-rose-300 text-xs px-1 disabled:opacity-30"
                  title="Forget this dataset"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {msg && (
        <div
          className={`px-5 py-3 text-xs border-t border-vault-border ${
            msg.ok ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          {msg.text}
        </div>
      )}
    </aside>
  )
}
