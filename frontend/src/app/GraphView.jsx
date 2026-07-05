import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { getGraph } from '../api'

const TYPE_COLOR = {
  person: '#8b86ff',
  email: '#6E68FF',
  meeting: '#5cbf9a',
  note: '#d9a24a',
  decision: '#c084d9',
}

export default function GraphView() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState(null)
  const holderRef = useRef(null)
  const svgRef = useRef(null)
  const selectedRef = useRef(null)
  const linkSel = useRef(null)

  // Highlight edges incident to the selected node without rebuilding the layout.
  const applyHighlight = useCallback((sel) => {
    selectedRef.current = sel
    if (!linkSel.current) return
    linkSel.current.attr('stroke', (d) =>
      sel && ((d.source.id || d.source) === sel || (d.target.id || d.target) === sel)
        ? 'rgba(139,134,255,0.7)'
        : 'rgba(120,124,180,0.22)'
    )
  }, [])

  useEffect(() => {
    applyHighlight(selected?.id || null)
  }, [selected, applyHighlight])

  useEffect(() => {
    getGraph()
      .then(({ data }) => setData(data))
      .catch(() => setError(true))
  }, [])

  useEffect(() => {
    const holder = holderRef.current
    const svgEl = svgRef.current
    if (!holder || !svgEl || !data?.nodes?.length) return

    const W = holder.clientWidth
    const H = holder.clientHeight
    const nodes = data.nodes.map((n) => ({ ...n }))
    const links = (data.edges || []).map((e) => ({ ...e }))

    const svg = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`)
    svg.selectAll('*').remove()

    const sim = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(70).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-160))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide(22))

    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1)
      .attr('stroke', 'rgba(120,124,180,0.22)')
    linkSel.current = link

    const node = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_e, d) => setSelected(d))
      .call(
        d3
          .drag()
          .on('start', (e, d) => {
            if (!e.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (e, d) => {
            d.fx = e.x
            d.fy = e.y
          })
          .on('end', (e, d) => {
            if (!e.active) sim.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    node
      .append('circle')
      .attr('r', (d) => (d.type === 'person' ? 11 : 7))
      .attr('fill', (d) => TYPE_COLOR[d.type] || '#aab0c0')
      .attr('stroke', '#0B0D12')
      .attr('stroke-width', 1)

    node
      .append('text')
      .text((d) => (d.label || '').slice(0, 22))
      .attr('x', 13)
      .attr('y', 4)
      .attr('fill', '#c7ccdb')
      .attr('font-size', 9)
      .attr('font-family', "'IBM Plex Mono', monospace")

    const redraw = () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)
      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    }
    sim.on('tick', redraw)
    applyHighlight(selectedRef.current)

    return () => sim.stop()
  }, [data, applyHighlight])

  const connected = selected
    ? (data?.edges || [])
        .filter((e) => e.source === selected.id || e.source?.id === selected.id || e.target === selected.id || e.target?.id === selected.id)
        .map((e) => {
          const otherId = (e.source.id || e.source) === selected.id ? (e.target.id || e.target) : (e.source.id || e.source)
          const node = data.nodes.find((n) => n.id === otherId)
          return { label: node?.label || otherId, rel: e.label }
        })
    : []

  return (
    <div className="h-full grid grid-cols-[1fr_320px]">
      <div className="relative" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 45%, #12141c, #0B0D12)' }}>
        <div className="absolute top-5 left-6 z-10 pointer-events-none">
          <h1 className="text-[18px] font-semibold text-mist">Memory Graph</h1>
          <p className="font-mono text-[11px] text-muted mt-0.5">click a node to inspect · drag to explore</p>
        </div>
        <div className="absolute bottom-5 left-6 z-10 flex gap-3 pointer-events-none">
          {Object.entries(TYPE_COLOR).map(([t, c]) => (
            <div key={t} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: c }} />
              <span className="text-[11px] text-[#aab0c0] capitalize">{t}</span>
            </div>
          ))}
        </div>
        <div ref={holderRef} className="absolute inset-0">
          <svg ref={svgRef} className="h-full w-full" />
          {!data && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
              Extracting your knowledge graph…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-danger text-sm">
              Couldn't build the graph.
            </div>
          )}
          {data && !data.nodes?.length && (
            <div className="absolute inset-0 flex items-center justify-center text-muted text-sm px-8 text-center">
              No connections yet — add memories to grow your graph.
            </div>
          )}
        </div>
      </div>

      {/* inspector */}
      <div className="bg-white border-l border-[#e2e4ea] p-6 overflow-y-auto">
        {!selected ? (
          <div className="text-[13px] text-[#8b90a0]">Select a node to inspect its connections.</div>
        ) : (
          <>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: TYPE_COLOR[selected.type] || '#8b90a0' }}>
              {selected.type}
            </div>
            <h2 className="text-[18px] font-semibold text-ink-900 mb-4">{selected.label}</h2>
            <div className="font-mono text-[10px] tracking-[0.14em] text-[#9aa3b2] mb-2">
              CONNECTED TO
            </div>
            <div className="space-y-2">
              {connected.length === 0 && <div className="text-[13px] text-[#8b90a0]">No connections.</div>}
              {connected.map((c, i) => (
                <div key={i} className="text-[13px]">
                  <span className="text-ink-900">{c.label}</span>
                  {c.rel && <span className="font-mono text-[10px] text-[#9aa3b2] ml-2">{c.rel}</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
