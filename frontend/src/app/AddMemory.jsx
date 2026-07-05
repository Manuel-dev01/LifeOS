import { useState } from 'react'
import { ingestFile, ingestCalendar } from '../api'

const TABS = ['File', 'Calendar']

// Reusable "import a real memory" panel wired to the ingest endpoints.
// Paste-text was removed intentionally: connecting an account is the primary
// path; file/calendar import remains for one-off documents.
export default function AddMemory({ onDone, dark = false }) {
  const [tab, setTab] = useState('File')
  const [name, setName] = useState('')
  const [ics, setIcs] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async () => {
    setBusy(true)
    setMsg(null)
    try {
      if (tab === 'File' && file) await ingestFile(file, name.trim() || 'upload')
      else if (tab === 'Calendar' && ics.trim()) await ingestCalendar(ics, name.trim() || 'calendar')
      else {
        setBusy(false)
        return
      }
      setIcs('')
      setFile(null)
      setMsg({ ok: true, text: 'Remembered ✓' })
      onDone?.()
    } catch {
      setMsg({ ok: false, text: 'Failed to remember' })
    } finally {
      setBusy(false)
    }
  }

  const surface = dark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white border-[#eceef3]'
  const fieldBg = dark ? 'bg-black/20 border-white/[0.1] text-mist' : 'bg-[#f7f8fb] border-[#e2e4ea] text-ink-900'
  const textCol = dark ? 'text-mist' : 'text-ink-900'

  return (
    <div className={`rounded-2xl border p-4 ${surface}`}>
      <div className="flex gap-1 mb-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-[12px] py-1.5 rounded-md transition ${
              tab === t ? 'bg-brand text-white' : `${dark ? 'text-muted-2' : 'text-[#8b90a0]'} hover:${textCol}`
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="vault name (optional)"
        className={`w-full mb-2 text-[12px] rounded-md border px-2 py-1.5 focus:outline-none focus:border-brand ${fieldBg}`}
      />
      {tab === 'File' && (
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className={`w-full text-[12px] ${dark ? 'text-muted-2' : 'text-[#565d6b]'} file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand file:text-white file:text-xs`}
        />
      )}
      {tab === 'Calendar' && (
        <textarea
          value={ics}
          onChange={(e) => setIcs(e.target.value)}
          rows={3}
          placeholder="Paste raw .ics calendar content…"
          className={`w-full text-[13px] font-mono rounded-md border px-3 py-2 resize-none focus:outline-none focus:border-brand ${fieldBg}`}
        />
      )}
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={submit}
          disabled={busy}
          className="text-[13px] px-4 py-2 rounded-md bg-brand text-white hover:brightness-110 disabled:opacity-40 transition"
        >
          {busy ? 'Remembering…' : 'Remember'}
        </button>
        {msg && (
          <span className={`text-[12px] ${msg.ok ? 'text-meeting' : 'text-danger'}`}>{msg.text}</span>
        )}
      </div>
    </div>
  )
}
