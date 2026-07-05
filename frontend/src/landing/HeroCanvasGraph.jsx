import { useEffect, useRef } from 'react'

// 2D canvas particle network behind the hero — a drifting node/edge field that
// reacts to the cursor. Ported from the mockup's _startHeroGraph.
const TYPES = ['#6E68FF', '#5cbf9a', '#d9a24a', '#aab0c0']
const LINK = 132

export default function HeroCanvasGraph() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let W, H, dpr, nodes
    const mouse = { x: -9999, y: -9999 }

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(46, Math.floor((W * H) / 26000))
      nodes = Array.from({ length: count }, () => {
        const r = Math.random()
        const type = r < 0.14 ? 0 : r < 0.5 ? 1 : r < 0.8 ? 2 : 3
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          color: TYPES[type],
          hub: Math.random() < 0.08,
          phase: Math.random() * Math.PI * 2,
        }
      })
    }

    const step = () => {
      ctx.clearRect(0, 0, W, H)
      const now = performance.now() / 1000
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
        // mouse repel
        const dx = n.x - mouse.x
        const dy = n.y - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < 150) {
          const f = ((150 - dist) / 150) * 0.5
          n.x += (dx / (dist || 1)) * f
          n.y += (dy / (dist || 1)) * f
        }
      }
      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < LINK) {
            const alpha = (1 - d / LINK) * 0.5
            ctx.strokeStyle = `rgba(120,124,200,${alpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      // nodes + mouse links
      for (const n of nodes) {
        const md = Math.hypot(n.x - mouse.x, n.y - mouse.y)
        if (md < 170) {
          ctx.strokeStyle = `rgba(139,134,255,${(1 - md / 170) * 0.55})`
          ctx.beginPath()
          ctx.moveTo(n.x, n.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.stroke()
        }
        if (n.hub) {
          const glow = 0.5 + 0.5 * Math.sin(now * 1.6 + n.phase)
          ctx.fillStyle = `rgba(110,104,255,${0.12 * glow})`
          ctx.beginPath()
          ctx.arc(n.x, n.y, 14, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = n.hub ? '#8b86ff' : n.color
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.hub ? 5.2 : 2.4, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(step)
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    step()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />
}
