import MemoryGraph3D from './MemoryGraph3D'

export default function GraphSection() {
  return (
    <section
      id="graph"
      className="relative min-h-[900px] overflow-hidden px-6 md:px-[6vw] py-[150px]"
      style={{
        background:
          'radial-gradient(ellipse 62% 58% at 56% 46%, #14172c, #0B0D12 72%)',
      }}
    >
      <MemoryGraph3D />

      <div className="relative z-10 max-w-2xl revl">
        <div className="font-mono text-[12px] tracking-[0.18em] text-lavender mb-5">
          01 · THE GRAPH
        </div>
        <h2
          className="font-sora font-bold text-mist-bright"
          style={{ fontSize: 'clamp(34px,4.2vw,60px)', lineHeight: 1.02, letterSpacing: '-0.035em' }}
        >
          Every fact you own,
          <br />
          held in one place, and{' '}
          <span className="font-light italic text-lavender">connected.</span>
        </h2>
        <p className="mt-6 text-[18px] leading-relaxed text-[#b9bece] max-w-lg">
          A single living graph, in real 3D. A name in an email links to the meeting it
          happened in, the decision it produced, and the note you wrote after.
        </p>
      </div>

      {/* floating labels */}
      <div className="absolute right-[8vw] top-[26%] z-10 hidden lg:block animate-floaty">
        <div
          className="rounded-2xl border border-white/[0.08] p-4 w-56"
          style={{ background: 'rgba(20,22,32,0.72)', backdropFilter: 'blur(8px)' }}
        >
          <div className="font-mono text-[10px] tracking-[0.14em] text-lavender">
            PERSON · HUB NODE
          </div>
          <div className="text-mist font-semibold mt-1">Dana Whitfield</div>
          <div className="font-mono text-[11px] text-[#8890a2] mt-1">
            14 emails · 6 meetings · 3 decisions
          </div>
        </div>
      </div>
      <div
        className="absolute right-[14vw] bottom-[22%] z-10 hidden lg:block animate-floaty"
        style={{ animationDelay: '0.6s' }}
      >
        <div
          className="rounded-2xl border border-white/[0.08] p-4 w-48"
          style={{ background: 'rgba(20,22,32,0.72)', backdropFilter: 'blur(8px)' }}
        >
          <div className="font-mono text-[10px] tracking-[0.14em] text-meeting">MEETING</div>
          <div className="text-mist font-semibold mt-1">Pricing sync · Mar 15</div>
        </div>
      </div>

      {/* legend + corner */}
      <div className="absolute left-6 md:left-[6vw] bottom-10 z-10 flex flex-wrap gap-4">
        {[
          ['Email', '#6E68FF'],
          ['Meeting', '#5cbf9a'],
          ['Note', '#d9a24a'],
          ['Person', '#8b86ff'],
        ].map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-[12px] text-[#aab0c0]">{label}</span>
          </div>
        ))}
      </div>
      <div className="hidden md:block absolute right-6 md:right-[6vw] bottom-10 z-10 font-mono text-[11px] tracking-[0.14em] text-[#6b7180]">
        DRAG TO ORBIT
      </div>
    </section>
  )
}
