import { useState } from 'react'
import { forgetDataset } from '../api'
import ViewHeader from './ViewHeader'
import AddMemory from './AddMemory'

export default function SourcesView({ datasets, onChange }) {
  const [busy, setBusy] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const forget = async (name) => {
    if (!confirm(`Forget "${name}"? This permanently deletes those memories.`)) return
    setBusy(name)
    try {
      await forgetDataset(name)
      onChange()
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
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl mx-auto">
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

          {datasets.length === 0 && (
            <div className="text-[#8b90a0] text-sm">
              No sources yet — add your first memory above.
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
