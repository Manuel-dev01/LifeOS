import { useEffect, useState } from 'react'

// The "walks the graph" traversal rail. Animates a fixed QUESTION→sources→
// ANSWER path while a query runs, then settles showing the real source count.
const NODES = [
  { id: 'q', x: 150, y: 34, label: 'QUESTION', color: '#8b86ff', r: 7 },
  { id: 'email', x: 68, y: 130, label: 'Email', color: '#6E68FF', r: 9 },
  { id: 'note', x: 232, y: 130, label: 'Note', color: '#d9a24a', r: 9 },
  { id: 'meeting', x: 150, y: 216, label: 'Meeting', color: '#5cbf9a', r: 9 },
  { id: 'person', x: 150, y: 296, label: 'Source', color: '#8b86ff', r: 9 },
  { id: 'answer', x: 150, y: 352, label: 'ANSWER', color: '#8b86ff', r: 7 },
]
const EDGES = [
  ['q', 'email'],
  ['q', 'note'],
  ['email', 'meeting'],
  ['note', 'meeting'],
  ['meeting', 'person'],
  ['person', 'answer'],
]
const ORDER = ['email', 'note', 'meeting', 'person', 'answer']

export default function RecallRail({ loading, done, sourceCount = 0 }) {
  const [lit, setLit] = useState(0)

  useEffect(() => {
    if (loading) {
      setLit(0)
      const iv = setInterval(() => setLit((n) => Math.min(ORDER.length, n + 1)), 400)
      return () => clearInterval(iv)
    }
    if (done) setLit(ORDER.length)
  }, [loading, done])

  const isLit = (id) => id === 'q' || (ORDER.indexOf(id) >= 0 && ORDER.indexOf(id) < lit)

  return (
    <div
      className="h-full flex flex-col rounded-2xl p-5"
      style={{ background: 'radial-gradient(ellipse 90% 60% at 50% 30%, #14172a, #0d0f16)' }}
    >
      <div className="font-mono text-[10px] tracking-[0.16em] text-lavender mb-1">RECALL PATH</div>
      <svg viewBox="0 0 300 380" className="flex-1 w-full">
        {EDGES.map(([a, b], i) => {
          const na = NODES.find((n) => n.id === a)
          const nb = NODES.find((n) => n.id === b)
          const on = isLit(a) && isLit(b)
          return (
            <line
              key={i}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke={on ? 'rgba(139,134,255,0.7)' : 'rgba(120,124,180,0.28)'}
              strokeWidth="1.4"
            />
          )
        })}
        {NODES.map((n) => (
          <g key={n.id} opacity={isLit(n.id) ? 1 : 0.16} style={{ transition: 'opacity 0.3s' }}>
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} />
            <text
              x={n.x}
              y={n.y - 14}
              textAnchor="middle"
              fontSize="9"
              fontFamily="'IBM Plex Mono', monospace"
              fill="#aab0c0"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="font-mono text-[10px] text-muted text-center">
        {loading
          ? 'WALKING THE GRAPH…'
          : done
          ? `TRAVERSAL COMPLETE · ${sourceCount} source${sourceCount === 1 ? '' : 's'} cited`
          : 'ASK TO WALK THE GRAPH'}
      </div>
    </div>
  )
}
