import { Link } from 'react-router-dom'
import Logo, { Wordmark } from '../components/Logo'

const NAV_ITEMS = [
  { label: 'Product', target: 'product' },
  { label: 'Memory Graph', target: 'graph' },
  { label: 'Security', target: 'security' },
]

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4"
      style={{
        background: 'linear-gradient(180deg,rgba(11,13,18,0.82),rgba(11,13,18,0))',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <Logo size={26} />
        <Wordmark className="text-[19px] text-mist" />
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm text-[#aab0c0]">
        {NAV_ITEMS.map((it) => (
          <button
            key={it.target}
            onClick={() => scrollTo(it.target)}
            className="cursor-pointer hover:text-mist transition"
          >
            {it.label}
          </button>
        ))}
      </div>
      <Link
        to="/app"
        className="rounded-full bg-mist text-ink font-semibold text-sm px-[18px] py-2.5 hover:bg-white transition"
      >
        Open the app →
      </Link>
    </nav>
  )
}
