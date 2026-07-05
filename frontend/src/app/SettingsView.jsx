import { useState, useEffect } from 'react'
import { deleteVault, exportVault, improveMemory } from '../api'
import ViewHeader from './ViewHeader'

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className="h-6 w-11 rounded-full transition relative"
      style={{ background: on ? '#4A44E6' : '#d7dae2' }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: on ? '22px' : '2px' }}
      />
    </button>
  )
}

export default function SettingsView({ onChange }) {
  const [localOnly, setLocalOnly] = useState(false)
  const [showSources, setShowSources] = useState(true)
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    setLocalOnly(localStorage.getItem('lifeos.localOnly') === '1')
    setShowSources(localStorage.getItem('lifeos.showSources') !== '0')
  }, [])

  const toggleLocal = () => {
    const v = !localOnly
    setLocalOnly(v)
    localStorage.setItem('lifeos.localOnly', v ? '1' : '0')
  }
  const toggleSources = () => {
    const v = !showSources
    setShowSources(v)
    localStorage.setItem('lifeos.showSources', v ? '1' : '0')
  }

  const doExport = async () => {
    setBusy('export')
    setMsg(null)
    try {
      const { data } = await exportVault()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'lifeos-export.json'
      a.click()
      URL.revokeObjectURL(url)
      setMsg({ ok: true, text: 'Exported ✓' })
    } catch {
      setMsg({ ok: false, text: 'Export failed' })
    } finally {
      setBusy(null)
    }
  }

  const doImprove = async () => {
    setBusy('improve')
    setMsg(null)
    try {
      await improveMemory()
      setMsg({ ok: true, text: 'Memory sharpened. Graph re-enriched ✓' })
      onChange?.()
    } catch {
      setMsg({ ok: false, text: 'Improve failed' })
    } finally {
      setBusy(null)
    }
  }

  const doDelete = async () => {
    if (!confirm('Delete your ENTIRE vault? Every memory will be permanently forgotten.')) return
    setBusy('delete')
    setMsg(null)
    try {
      await deleteVault()
      setMsg({ ok: true, text: 'Vault deleted' })
      onChange?.()
    } catch {
      setMsg({ ok: false, text: 'Delete failed' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <ViewHeader title="Settings & Privacy" subtitle="your memory is yours alone" />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="rounded-2xl bg-white border border-[#eceef3] p-5">
            <div className="text-[15px] font-semibold text-ink-900 mb-1">Encryption</div>
            <p className="text-[13px] text-[#565d6b]">
              Your graph is encrypted at rest and in transit with keys only you hold. LifeOS
              never uses your data to train shared models.
            </p>
          </div>

          <Row title="Local-only mode" subtitle="Keep the graph on this device only">
            <Toggle on={localOnly} onClick={toggleLocal} />
          </Row>
          <Row title="Always show sources" subtitle="Every answer cites the memories it walked">
            <Toggle on={showSources} onClick={toggleSources} />
          </Row>
          <Row title="Sharpen memory" subtitle="Re-run improve() to enrich the graph">
            <button
              onClick={doImprove}
              disabled={busy === 'improve'}
              className="text-[13px] px-4 py-2 rounded-full bg-brand/10 text-brand hover:bg-brand/20 disabled:opacity-40 transition"
            >
              {busy === 'improve' ? 'Sharpening…' : '✨ Improve'}
            </button>
          </Row>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={doExport}
              disabled={busy === 'export'}
              className="text-[14px] px-5 py-2.5 rounded-xl border border-[#d7dae2] text-ink-900 hover:bg-[#f7f8fb] disabled:opacity-40 transition"
            >
              {busy === 'export' ? 'Exporting…' : 'Export everything'}
            </button>
            <button
              onClick={doDelete}
              disabled={busy === 'delete'}
              className="text-[14px] px-5 py-2.5 rounded-xl border border-[#f6d4d4] text-danger bg-[#fdecec] hover:brightness-95 disabled:opacity-40 transition"
            >
              {busy === 'delete' ? 'Deleting…' : 'Delete my vault'}
            </button>
            {msg && (
              <span className={`text-[13px] ${msg.ok ? 'text-meeting-dk' : 'text-danger'}`}>
                {msg.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white border border-[#eceef3] p-5">
      <div>
        <div className="text-[15px] font-medium text-ink-900">{title}</div>
        <div className="text-[13px] text-[#8b90a0]">{subtitle}</div>
      </div>
      {children}
    </div>
  )
}
