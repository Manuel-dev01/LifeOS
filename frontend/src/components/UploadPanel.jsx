import { useState } from 'react'
import { ingestText, ingestFile, ingestCalendar } from '../api'

const TABS = ['Text', 'File', 'Calendar']

export default function UploadPanel({ onIngested, setMsg }) {
  const [tab, setTab] = useState('Text')
  const [text, setText] = useState('')
  const [datasetName, setDatasetName] = useState('')
  const [ics, setIcs] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)

  const done = (ok, txt) => {
    setBusy(false)
    setMsg?.({ ok, text: txt })
    if (ok) onIngested?.()
  }

  const submitText = async () => {
    if (!text.trim()) return
    setBusy(true)
    try {
      await ingestText(text, datasetName.trim() || 'notes')
      setText('')
      done(true, 'Text remembered')
    } catch {
      done(false, 'Failed to remember text')
    }
  }

  const submitFile = async () => {
    if (!file) return
    setBusy(true)
    try {
      await ingestFile(file, datasetName.trim() || 'upload')
      setFile(null)
      done(true, `Remembered ${file.name}`)
    } catch {
      done(false, 'Failed to remember file')
    }
  }

  const submitCalendar = async () => {
    if (!ics.trim()) return
    setBusy(true)
    try {
      await ingestCalendar(ics, datasetName.trim() || 'calendar')
      setIcs('')
      done(true, 'Calendar remembered')
    } catch {
      done(false, 'Failed to remember calendar')
    }
  }

  return (
    <div className="px-5 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
        Add to Memory
      </h3>

      <div className="flex gap-1 mb-3 bg-vault-bg/60 p-1 rounded-lg border border-vault-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs py-1.5 rounded-md transition ${
              tab === t
                ? 'bg-vault-accent text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <input
        value={datasetName}
        onChange={(e) => setDatasetName(e.target.value)}
        placeholder="dataset name (optional)"
        className="w-full mb-2 text-xs bg-vault-bg/60 border border-vault-border rounded-md px-2 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-vault-accent"
      />

      {tab === 'Text' && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste an email, note, or any text to remember…"
            rows={4}
            className="w-full text-sm bg-vault-bg/60 border border-vault-border rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-vault-accent resize-none"
          />
          <button
            onClick={submitText}
            disabled={busy || !text.trim()}
            className="mt-2 w-full text-sm py-2 rounded-md bg-vault-accent text-white hover:bg-indigo-500 disabled:opacity-40 transition"
          >
            {busy ? 'Remembering…' : 'Remember'}
          </button>
        </>
      )}

      {tab === 'File' && (
        <>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-vault-accent file:text-white file:text-xs hover:file:bg-indigo-500"
          />
          <button
            onClick={submitFile}
            disabled={busy || !file}
            className="mt-2 w-full text-sm py-2 rounded-md bg-vault-accent text-white hover:bg-indigo-500 disabled:opacity-40 transition"
          >
            {busy ? 'Remembering…' : 'Remember File'}
          </button>
          <p className="mt-1 text-[10px] text-slate-500">PDF, TXT, MD, CSV, JSON, DOCX</p>
        </>
      )}

      {tab === 'Calendar' && (
        <>
          <textarea
            value={ics}
            onChange={(e) => setIcs(e.target.value)}
            placeholder="Paste raw .ics calendar content…"
            rows={4}
            className="w-full text-sm bg-vault-bg/60 border border-vault-border rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-vault-accent resize-none font-mono"
          />
          <button
            onClick={submitCalendar}
            disabled={busy || !ics.trim()}
            className="mt-2 w-full text-sm py-2 rounded-md bg-vault-accent text-white hover:bg-indigo-500 disabled:opacity-40 transition"
          >
            {busy ? 'Remembering…' : 'Remember Calendar'}
          </button>
        </>
      )}
    </div>
  )
}
