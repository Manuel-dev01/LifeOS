export default function RecallFeature() {
  return (
    <section className="bg-paper text-ink-900 px-6 md:px-[6vw] py-[130px]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[1.05fr_1fr] gap-16 items-center">
        {/* left copy */}
        <div className="revl">
          <div className="font-mono text-[12px] tracking-[0.18em] text-brand mb-5">
            02 — RECALL, NOT SEARCH
          </div>
          <h2
            className="font-sora font-bold"
            style={{ fontSize: 'clamp(34px,4vw,58px)', lineHeight: 1.0, letterSpacing: '-0.035em' }}
          >
            You don't search.
            <br />
            You just <span className="font-light italic text-brand">ask.</span>
          </h2>
          <p className="mt-6 text-[18px] leading-relaxed text-[#565d6b] max-w-lg">
            No keywords, no folders, no scrolling. Ask the way you'd ask a colleague who
            was in every meeting and read every email — and get an answer with the sources
            it walked to get there.
          </p>
          <div className="mt-8 space-y-3 border-l-2 border-brand/30 pl-5">
            <p className="text-[17px] font-semibold">
              "What did I promise the design team last quarter?"
            </p>
            <p className="text-[16px] text-[#8b90a0]">"Who introduced me to Dana, and when?"</p>
            <p className="text-[16px] text-[#8b90a0]">
              "Summarize every decision about pricing."
            </p>
          </div>
        </div>

        {/* right answer visual */}
        <div className="relative revl">
          <div
            className="absolute -left-6 -top-8 w-40 rounded-xl bg-white border border-[#e2e4ea] p-3 rotate-[-4deg]"
            style={{ boxShadow: '0 20px 50px -20px rgba(19,21,27,0.25)' }}
          >
            <div className="font-mono text-[9px] tracking-[0.12em] text-[#8b90a0]">
              SOURCE 01 · EMAIL
            </div>
            <div className="text-[13px] font-medium mt-1">Re: Q3 pricing</div>
          </div>
          <div
            className="absolute -right-4 -bottom-8 w-40 rounded-xl bg-white border border-[#e2e4ea] p-3 rotate-[5deg] z-20"
            style={{ boxShadow: '0 20px 50px -20px rgba(19,21,27,0.25)' }}
          >
            <div className="font-mono text-[9px] tracking-[0.12em] text-[#8b90a0]">
              SOURCE 02 · MEETING
            </div>
            <div className="text-[13px] font-medium mt-1">Pricing sync</div>
          </div>

          <div
            className="relative z-10 rounded-2xl bg-ink-900 text-mist p-7"
            style={{ boxShadow: '0 40px 90px -30px rgba(19,21,27,0.5)' }}
          >
            <div className="font-mono text-[10px] tracking-[0.16em] text-[#8890a2] mb-3">
              ANSWER
            </div>
            <p className="text-[17px] leading-relaxed">
              You agreed to a{' '}
              <span className="text-lavender font-medium">12% price uplift</span> effective
              Q3, during the{' '}
              <span className="text-meeting font-medium">Pricing sync on Mar 15</span> with
              Dana — confirmed in your decision log the same day.
            </p>
            <div className="flex gap-2 mt-5">
              {['1 email', '1 meeting', '1 note'].map((c) => (
                <span
                  key={c}
                  className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-white/[0.06] text-[#c7ccdb]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
