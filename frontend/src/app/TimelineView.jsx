import { useEffect, useState } from 'react'
import { getTimeline } from '../api'
import ViewHeader from './ViewHeader'

const KIND_COLOR = {
  email: '#6E68FF',
  meeting: '#5cbf9a',
  note: '#d9a24a',
  decision: '#c084d9',
  action: '#4A44E6',
  event: '#8b86ff',
}

// The LLM sometimes returns full ISO timestamps; show a clean human date.
function fmtDate(d) {
  if (!d) return ''
  const parsed = new Date(d)
  if (!isNaN(parsed.getTime()) && /\d{4}-\d{2}-\d{2}|T\d{2}:/.test(String(d))) {
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return d // already human, e.g. "Mar 15"
}

export default function TimelineView() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getTimeline()
      .then(({ data }) => setItems(data))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="h-full flex flex-col">
      <ViewHeader title="Timeline" subtitle="every memory, in the order it happened" />
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {!items && !error && <Skeleton />}
          {error && <div className="text-danger text-sm">Couldn't load your timeline.</div>}
          {items && items.length === 0 && (
            <div className="text-[#8b90a0] text-sm">No dated memories yet.</div>
          )}
          {items && (
            <div className="relative border-l border-[#e2e4ea] pl-8 space-y-6">
              {items.map((it, i) => (
                <div key={i} className="relative">
                  <span
                    className="absolute -left-[38px] top-1.5 h-3 w-3 rounded-sm"
                    style={{ background: KIND_COLOR[it.kind] || '#8b86ff' }}
                  />
                  <div className="font-mono text-[11px] text-[#9aa3b2] mb-1">
                    {fmtDate(it.date)} · {it.kind}
                  </div>
                  <div
                    className="rounded-2xl bg-white border border-[#eceef3] p-4"
                    style={{ boxShadow: '0 14px 40px -30px rgba(19,21,27,0.25)' }}
                  >
                    <div className="text-[15px] font-semibold text-ink-900">{it.title}</div>
                    <div className="text-[13px] text-[#565d6b] mt-1">{it.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-[#eef0f4] animate-pulse" />
      ))}
    </div>
  )
}
