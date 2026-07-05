import { useEffect, useState } from 'react'
import { getPeople } from '../api'
import ViewHeader from './ViewHeader'

const AVATAR_BG = [
  'from-brand to-lavender',
  'from-[#4aa3d9] to-[#8b86ff]',
  'from-[#c084d9] to-[#4A44E6]',
  'from-meeting to-[#4aa3d9]',
  'from-note to-[#d9a24a]',
  'from-[#611f69] to-[#c084d9]',
]

export default function PeopleView({ onOpenPerson }) {
  const [people, setPeople] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getPeople()
      .then(({ data }) => setPeople(data))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="h-full flex flex-col">
      <ViewHeader title="People" subtitle="the humans your memory revolves around" />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {!people && !error && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))' }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-[#eef0f4] animate-pulse" />
            ))}
          </div>
        )}
        {error && <div className="text-danger text-sm">Couldn't load people.</div>}
        {people && people.length === 0 && (
          <div className="text-[#8b90a0] text-sm">No people found in your memories yet.</div>
        )}
        {people && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))' }}>
            {people.map((p, i) => (
              <button
                key={p.name}
                onClick={() => onOpenPerson(p.name)}
                className="text-left rounded-2xl bg-white border border-[#eceef3] p-5 hover:border-brand/40 transition"
                style={{ boxShadow: '0 14px 40px -30px rgba(19,21,27,0.25)' }}
              >
                <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${AVATAR_BG[i % AVATAR_BG.length]} flex items-center justify-center text-[13px] font-semibold text-white mb-3`}>
                  {p.initials || '?'}
                </div>
                <div className="text-[15px] font-semibold text-ink-900">{p.name}</div>
                <div className="text-[12px] text-[#8b90a0] mb-3">{p.role || '—'}{p.org ? ` · ${p.org}` : ''}</div>
                <div className="font-mono text-[11px] text-[#9aa3b2]">
                  {p.emails || 0} emails · {p.meetings || 0} meetings · {p.decisions || 0} decisions
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
