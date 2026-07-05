import { useEffect, useState } from 'react'
import { getPerson } from '../api'

const KIND_COLOR = { email: '#6E68FF', meeting: '#5cbf9a', note: '#d9a24a', decision: '#c084d9' }

export default function PersonView({ name, onBack }) {
  const [person, setPerson] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!name) return
    setPerson(null)
    setError(false)
    getPerson(name)
      .then(({ data }) => setPerson(data))
      .catch(() => setError(true))
  }, [name])

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 md:px-8 py-5 border-b border-[#e2e4ea]">
        <button onClick={onBack} className="text-[13px] text-brand hover:underline">
          ← People
        </button>
      </div>
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
        {!person && !error && <div className="h-40 rounded-2xl bg-[#eef0f4] animate-pulse" />}
        {error && <div className="text-danger text-sm">Couldn't load {name}.</div>}
        {person && (
          <>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-brand to-lavender flex items-center justify-center text-[22px] font-semibold text-white">
                {person.initials || (person.name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-[24px] font-semibold text-ink-900">{person.name}</h1>
                <p className="text-[13px] text-[#8b90a0]">
                  {person.role || '·'}
                  {person.org ? ` · ${person.org}` : ''}
                  {person.first_met ? ` · first met ${person.first_met}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <Stat label="EMAILS" value={person.emails} color="#6E68FF" />
              <Stat label="MEETINGS" value={person.meetings} color="#5cbf9a" />
              <Stat label="SHARED DECISIONS" value={person.decisions} color="#d9a24a" />
            </div>

            <div className="font-mono text-[11px] tracking-[0.14em] text-[#9aa3b2] mb-3">
              RECENT THREADS
            </div>
            <div className="space-y-2">
              {(person.threads || []).length === 0 && (
                <div className="text-[13px] text-[#8b90a0]">No threads found.</div>
              )}
              {(person.threads || []).map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-white border border-[#eceef3] px-4 py-3"
                >
                  <span
                    className="h-2 w-2 rounded-sm shrink-0"
                    style={{ background: KIND_COLOR[t.kind] || '#8b86ff' }}
                  />
                  <span className="text-[14px] text-ink-900 flex-1">{t.title}</span>
                  <span className="font-mono text-[11px] text-[#9aa3b2]">{t.date}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-white border border-[#eceef3] p-4">
      <div className="font-mono text-[10px] tracking-[0.12em] text-[#9aa3b2] mb-1">{label}</div>
      <div className="text-[28px] font-bold" style={{ color }}>
        {value ?? 0}
      </div>
    </div>
  )
}
