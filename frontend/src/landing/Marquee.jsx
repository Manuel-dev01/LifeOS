const FEEDS = [
  'Gmail',
  'Outlook',
  'Notion',
  'Google Calendar',
  'Slack',
  'Apple Notes',
  'Docs',
  'Meet transcripts',
]

export default function Marquee() {
  const row = [...FEEDS, ...FEEDS]
  return (
    <div className="relative border-y border-white/[0.06] bg-ink py-4 overflow-hidden">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-ink pr-4 font-mono text-[11px] tracking-[0.18em] text-lavender">
        FEEDS ON →
      </div>
      <div className="flex whitespace-nowrap animate-marqueeX pl-40" style={{ width: 'max-content' }}>
        {row.map((f, i) => (
          <span key={i} className="mx-6 text-[15px] text-[#8890a2] flex items-center gap-6">
            {f}
            <span className="h-1 w-1 rounded-full bg-[#2f3442]" />
          </span>
        ))}
      </div>
    </div>
  )
}
