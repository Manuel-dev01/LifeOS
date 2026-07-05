import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Real 3D memory-graph point cloud (Three.js). Ported from the mockup's
// _initThree: a flattened sphere of ~300 typed nodes, additive-blended edges,
// slow auto-spin + eased mouse parallax. No shaders/physics.
const R = 46
const N = 300
const LINK = 12
const MAXE = 3
const TYPE_COLORS = [
  new THREE.Color(0x6e68ff), // email
  new THREE.Color(0x5cbf9a), // meeting
  new THREE.Color(0xd9a24a), // note
  new THREE.Color(0x8b86ff), // person
]

function spriteTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.4, 'rgba(255,255,255,0.6)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  const tex = new THREE.Texture(c)
  tex.needsUpdate = true
  return tex
}

export default function MemoryGraph3D() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let W = mount.clientWidth
    let H = mount.clientHeight
    let raf

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0b0d12, 0.014)
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 400)
    camera.position.z = 74

    const group = new THREE.Group()
    scene.add(group)

    // nodes
    const positions = []
    const colors = []
    const nodePos = []
    for (let i = 0; i < N; i++) {
      // rejection-sampled unit vector, flattened on Y
      let x, y, z, d
      do {
        x = Math.random() * 2 - 1
        y = Math.random() * 2 - 1
        z = Math.random() * 2 - 1
        d = x * x + y * y + z * z
      } while (d > 1 || d === 0)
      const rr = Math.pow(Math.random(), 0.5) * R
      const len = Math.sqrt(d)
      const px = (x / len) * rr
      const py = (y / len) * rr * 0.7
      const pz = (z / len) * rr
      positions.push(px, py, pz)
      nodePos.push(new THREE.Vector3(px, py, pz))
      const r = Math.random()
      const t = r < 0.06 ? 3 : r < 0.5 ? 0 : r < 0.8 ? 1 : 2
      const col = TYPE_COLORS[t]
      colors.push(col.r, col.g, col.b)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    const sprite = spriteTexture()
    const points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 2.1,
        map: sprite,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      })
    )
    group.add(points)

    // hubs
    const hubPos = []
    for (let i = 0; i < N; i++) {
      if (Math.random() < 0.05) {
        const p = nodePos[i]
        hubPos.push(p.x, p.y, p.z)
      }
    }
    if (hubPos.length) {
      const hgeo = new THREE.BufferGeometry()
      hgeo.setAttribute('position', new THREE.Float32BufferAttribute(hubPos, 3))
      group.add(
        new THREE.Points(
          hgeo,
          new THREE.PointsMaterial({
            size: 6.5,
            map: sprite,
            color: 0xb8b4ff,
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        )
      )
    }

    // edges (distance-based, capped per node)
    const edgePos = []
    const edgeCol = []
    const ec = new THREE.Color(0.42, 0.44, 0.72)
    const counts = new Array(N).fill(0)
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (counts[i] >= MAXE || counts[j] >= MAXE) continue
        if (nodePos[i].distanceTo(nodePos[j]) < LINK) {
          const a = nodePos[i]
          const b = nodePos[j]
          edgePos.push(a.x, a.y, a.z, b.x, b.y, b.z)
          edgeCol.push(ec.r, ec.g, ec.b, ec.r, ec.g, ec.b)
          counts[i]++
          counts[j]++
        }
      }
    }
    const egeo = new THREE.BufferGeometry()
    egeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePos, 3))
    egeo.setAttribute('color', new THREE.Float32BufferAttribute(edgeCol, 3))
    group.add(
      new THREE.LineSegments(
        egeo,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
        })
      )
    )

    // interaction
    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    const onMove = (e) => {
      target.x = e.clientX / window.innerWidth - 0.5
      target.y = e.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('mousemove', onMove)

    const animate = () => {
      cur.x += (target.x - cur.x) * 0.05
      cur.y += (target.y - cur.y) * 0.05
      group.rotation.y += 0.0012
      group.rotation.x = cur.y * 0.5
      camera.position.x = cur.x * 26
      camera.position.y = -cur.y * 16
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      W = mount.clientWidth
      H = mount.clientHeight
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geo.dispose()
      egeo.dispose()
      sprite.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 h-full w-full" />
}
