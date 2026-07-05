import Nav from './Nav'
import Hero from './Hero'
import Marquee from './Marquee'
import GraphSection from './GraphSection'
import RecallFeature from './RecallFeature'
import DemoVideo from './DemoVideo'
import Pillars from './Pillars'
import CTA from './CTA'
import useReveal from './useReveal'

export default function Landing() {
  const root = useReveal()
  return (
    <div ref={root} className="relative bg-ink text-mist overflow-x-hidden">
      <Nav />
      <Hero />
      <Marquee />
      <GraphSection />
      <RecallFeature />
      <DemoVideo />
      <Pillars />
      <CTA />
    </div>
  )
}
