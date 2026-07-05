import { useEffect, useRef } from 'react'

// Adds the `in` class to any `.revl` descendants as they scroll into view.
export default function useReveal() {
  const root = useRef(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const targets = el.querySelectorAll('.revl')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.16 }
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])
  return root
}
