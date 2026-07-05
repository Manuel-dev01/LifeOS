import Logo, { Wordmark } from '../components/Logo'

const PRIMARY = [
  { key: 'ask', label: 'Ask', icon: 'M4 5h16M4 12h16M4 19h10' },
  { key: 'graph', label: 'Memory Graph', icon: 'M12 3v6m0 6v6M5 8l7 4 7-4' },
  { key: 'timeline', label: 'Timeline', icon: 'M12 4v16M6 8h.01M6 16h.01M18 8h.01M18 16h.01' },
  { key: 'people', label: 'People', icon: 'M17 20v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87M12 7a3 3 0 100-6 3 3 0 000 6z' },
]
const SYSTEM = [
  { key: 'sources', label: 'Sources', icon: 'M4 7h16M4 12h16M4 17h16' },
  { key: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5L5 11a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.3 2.5h4l.3-2.5a7 7 0 001.7-1l2.4 1 2-3.5L19 13a7 7 0 000-1z' },
]

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition ${
        active ? 'text-mist' : 'text-muted-2 hover:text-mist'
      }`}
      style={active ? { background: 'rgba(110,104,255,0.16)' } : undefined}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d={item.icon} />
      </svg>
      {item.label}
    </button>
  )
}

export default function Sidebar({ view, onNav, health, onReplayOnboarding }) {
  const isActive = (k) => view === k || (k === 'people' && view === 'person')
  return (
    <aside className="w-[230px] shrink-0 h-full flex flex-col bg-ink-side text-mist border-r border-white/[0.07]">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Logo size={24} />
        <Wordmark className="text-[17px]" />
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {PRIMARY.map((it) => (
          <NavItem key={it.key} item={it} active={isActive(it.key)} onClick={() => onNav(it.key)} />
        ))}
        <div className="px-3 pt-5 pb-2 font-mono text-[10px] tracking-[0.16em] text-faint">
          SYSTEM
        </div>
        {SYSTEM.map((it) => (
          <NavItem key={it.key} item={it} active={isActive(it.key)} onClick={() => onNav(it.key)} />
        ))}
      </nav>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-1.5 px-3 pb-3">
          <span className={`h-1.5 w-1.5 rounded-full ${health?.ok ? 'bg-meeting' : 'bg-danger'}`} />
          <span className="font-mono text-[10px] text-faint">
            {health?.ok ? `${health.dataset_count ?? ''} vaults online` : 'offline'}
          </span>
        </div>
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.03]">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-lavender flex items-center justify-center text-[11px] font-semibold text-white">
            AM
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium truncate">Alex Morgan</div>
            <div className="text-[11px] text-muted truncate">Personal vault</div>
          </div>
        </div>
        <button
          onClick={onReplayOnboarding}
          className="w-full text-left px-3 py-2 mt-1 text-[12px] text-muted hover:text-mist transition"
        >
          ↻ Replay onboarding
        </button>
      </div>
    </aside>
  )
}
