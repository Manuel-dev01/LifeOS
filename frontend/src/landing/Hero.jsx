import { useEffect, useState } from 'react'
import HeroCanvasGraph from './HeroCanvasGraph'

const PHRASES = [
  'When did I agree to the Q3 pricing change?',
  'Who introduced me to Dana?',
  'Summarize every decision about pricing.',
  'What did I promise the design team?',
]

const SOURCES = [
  'Email · "Re: Q3 pricing" · Mar 14',
  'Meeting · Pricing sync · Mar 15',
  'Note · "Decision log" · Mar 15',
]

function useTypewriter(phrases) {
  const [text, setText] = useState('')
  useEffect(() => {
    let pi = 0
    let ci = 0
    let deleting = false
    let timer
    const tick = () => {
      const phrase = phrases[pi]
      if (!deleting) {
        ci++
        setText(phrase.slice(0, ci))
        if (ci >= phrase.length) {
          timer = setTimeout(() => {
            deleting = true
            tick()
          }, 2200)
          return
        }
        timer = setTimeout(tick, 46 + Math.random() * 40)
      } else {
        ci -= 2
        if (ci <= 0) {
          ci = 0
          deleting = false
          pi = (pi + 1) % phrases.length
          timer = setTimeout(tick, 320)
          return
        }
        setText(phrase.slice(0, ci))
        timer = setTimeout(tick, 26)
      }
    }
    timer = setTimeout(tick, 600)
    return () => clearTimeout(timer)
  }, [phrases])
  return text
}

export default function Hero() {
  const typed = useTypewriter(PHRASES)

  return (
    <section className="relative h-screen min-h-[820px] overflow-hidden">
      <HeroCanvasGraph />
      {/* vignette overlays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 62% 42%, rgba(74,68,230,0.16), rgba(11,13,18,0) 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,13,18,0.35) 0%, rgba(11,13,18,0) 22%, rgba(11,13,18,0) 62%, rgba(11,13,18,0.96) 100%)',
        }}
      />

      {/* headline */}
      <div className="absolute left-6 md:left-[6vw] top-[30%] max-w-2xl pointer-events-none">
        <h1
          className="font-sora font-extrabold text-mist-bright"
          style={{
            fontSize: 'clamp(52px,6.6vw,110px)',
            lineHeight: 0.92,
            letterSpacing: '-0.045em',
          }}
        >
          Your AI that
          <br />
          never{' '}
          <span className="font-light italic text-lavender">forgets.</span>
        </h1>
        <p className="mt-6 text-[18px] md:text-[20px] leading-relaxed text-[#b9bece] max-w-xl">
          Feed it your emails, notes and calendars. Ask anything. LifeOS answers by
          walking the memory graph it quietly built from your whole life.
        </p>
      </div>

      {/* floating query card (decorative — hidden on phones to avoid overlapping the headline) */}
      <div
        className="hidden md:block absolute right-6 md:right-[6vw] bottom-[16%] w-[340px] max-w-[85vw] rounded-2xl border border-white/[0.08] p-5"
        style={{
          background: 'rgba(18,20,28,0.72)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 30px 80px -30px rgba(0,0,0,0.8)',
        }}
      >
        <div className="font-mono text-[10px] tracking-[0.16em] text-[#6b7180] mb-2">
          YOU ASK
        </div>
        <div className="text-mist text-[15px] min-h-[44px]">
          {typed}
          <span className="inline-block w-[2px] h-[19px] align-middle bg-lavender ml-0.5 animate-blink" />
        </div>
        <div className="font-mono text-[10px] tracking-[0.16em] text-lavender mt-4 mb-2">
          LIFEOS RECALLS · 3 SOURCES
        </div>
        <div className="space-y-1.5">
          {SOURCES.map((s) => (
            <div key={s} className="text-[12px] text-[#8890a2]">
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#6b7180]">SCROLL</span>
        <span
          className="h-8 w-px"
          style={{ background: 'linear-gradient(#6b7180,transparent)' }}
        />
      </div>
    </section>
  )
}
