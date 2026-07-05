import { Link } from 'react-router-dom'
import Logo, { Wordmark } from '../components/Logo'

const REPO_URL = 'https://github.com/Manuel-dev01/LifeOS'

// Only real destinations: on-page sections scroll, docs/source go to the repo.
const FOOTER_LINKS = [
  { label: 'Product', target: 'product' },
  { label: 'Memory Graph', target: 'graph' },
  { label: 'Security', target: 'security' },
  { label: 'Demo', target: 'demo' },
  { label: 'Docs', href: REPO_URL },
  { label: 'Source', href: REPO_URL },
]

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function CTA() {
  return (
    <section
      className="relative px-6 md:px-[6vw] pt-[150px] pb-[90px] overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 80% 120% at 50% 0%, #1a1c3a, #0B0D12 60%)',
      }}
    >
      <div className="max-w-4xl mx-auto text-center revl">
        <h2
          className="font-sora font-extrabold text-mist-bright"
          style={{ fontSize: 'clamp(40px,6vw,88px)', lineHeight: 0.96, letterSpacing: '-0.045em' }}
        >
          Stop trying to
          <br />
          remember it all.
        </h2>
        <p className="mt-6 text-[18px] md:text-[20px] text-[#b9bece] max-w-xl mx-auto">
          Give LifeOS your first thousand memories today. It'll hold them forever.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/app"
            className="rounded-full bg-brand text-white font-medium px-[30px] py-4 hover:brightness-110 transition"
            style={{ boxShadow: '0 16px 40px -12px rgba(74,68,230,0.7)' }}
          >
            Open the app →
          </Link>
          <button
            onClick={() => scrollTo('demo')}
            className="rounded-full border border-white/15 text-mist font-medium px-[30px] py-4 cursor-pointer hover:bg-white/[0.05] transition"
          >
            Watch the 90-sec tour
          </button>
        </div>
      </div>

      {/* footer */}
      <div className="max-w-6xl mx-auto mt-32 pt-8 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <Wordmark className="text-[16px] text-mist" />
        </div>
        <div className="flex flex-wrap gap-5 font-mono text-[12px] text-[#8890a2]">
          {FOOTER_LINKS.map((l) =>
            l.href ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer hover:text-mist transition"
              >
                {l.label}
              </a>
            ) : (
              <button
                key={l.label}
                onClick={() => scrollTo(l.target)}
                className="cursor-pointer hover:text-mist transition"
              >
                {l.label}
              </button>
            )
          )}
        </div>
        <div className="font-mono text-[11px] text-[#565d6b]">
          © 2026 LifeOS · Your AI that never forgets
        </div>
      </div>
    </section>
  )
}
