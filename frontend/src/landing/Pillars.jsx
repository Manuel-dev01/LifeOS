const PILLARS = [
  {
    title: 'Yours alone',
    body: 'Encrypted at rest and in transit. Your graph is never used to train shared models. Export or delete everything, any time.',
    mt: 'md:mt-0',
    icon: (
      <path
        d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"
        stroke="#8b86ff"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Always cited',
    body: 'Every answer shows the exact emails, meetings and notes it walked. No black box — you can always trace the path.',
    mt: 'md:mt-11',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" stroke="#5cbf9a" strokeWidth="1.6" fill="none" />
        <path d="M8 12l2.5 2.5L16 9" stroke="#5cbf9a" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: 'Never resets',
    body: 'Memory persists across infinite sessions. It compounds — the more you feed it, the sharper the connections become.',
    mt: 'md:mt-6',
    icon: (
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"
        stroke="#d9a24a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
]

export default function Pillars() {
  return (
    <section className="bg-ink px-6 md:px-[6vw] py-[130px]">
      <div className="max-w-6xl mx-auto">
        <div className="revl mb-16">
          <div className="font-mono text-[12px] tracking-[0.18em] text-lavender mb-5">
            03 — WHY IT HOLDS UP
          </div>
          <h2
            className="font-sora font-bold text-mist-bright max-w-2xl"
            style={{ fontSize: 'clamp(32px,3.6vw,52px)', lineHeight: 1.02, letterSpacing: '-0.035em' }}
          >
            Built to be trusted with your whole life.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className={`revl rounded-[18px] border border-white/[0.07] bg-ink-card p-7 ${p.mt}`}
            >
              <div className="h-11 w-11 rounded-xl bg-white/[0.04] flex items-center justify-center mb-5">
                <svg width="22" height="22" viewBox="0 0 24 24">
                  {p.icon}
                </svg>
              </div>
              <h3 className="text-[21px] font-semibold text-mist tracking-[-0.02em] mb-2">
                {p.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-[#8890a2]">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
