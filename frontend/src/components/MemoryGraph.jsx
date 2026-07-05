import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function MemoryGraph({ data }) {
  const holderRef = useRef(null)
  const svgRef = useRef(null)
  const hasNodes = !!data?.nodes?.length

  useEffect(() => {
    const holder = holderRef.current
    const svgEl = svgRef.current
    if (!holder || !svgEl) return

    // D3 owns ONLY the <svg> element — never the React-rendered placeholder.
    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    const nodes = (data?.nodes || []).map((n) => ({ ...n }))
    const edges = (data?.edges || []).map((e) => ({ ...e }))
    if (nodes.length === 0) return

    const width = holder.clientWidth || 400
    const height = holder.clientHeight || 480
    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`)

    const sim = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((d) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-320))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(34))

    const link = svg
      .append('g')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.2)
      .selectAll('line')
      .data(edges)
      .join('line')

    const linkLabel = svg
      .append('g')
      .selectAll('text')
      .data(edges)
      .join('text')
      .text((d) => d.label || '')
      .attr('fill', '#64748b')
      .attr('font-size', 8)
      .attr('text-anchor', 'middle')

    const node = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(
        d3
          .drag()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    node
      .append('circle')
      .attr('r', (d) => (d.kind === 'query' ? 13 : 9))
      .attr('fill', (d) => (d.kind === 'query' ? '#22d3ee' : '#6366f1'))
      .attr('stroke', (d) => (d.kind === 'query' ? '#0e7490' : '#22d3ee'))
      .attr('stroke-width', 1.5)

    node
      .append('text')
      .text((d) => d.label)
      .attr('x', 14)
      .attr('y', 4)
      .attr('fill', (d) => (d.kind === 'query' ? '#e2e8f0' : '#cbd5e1'))
      .attr('font-size', (d) => (d.kind === 'query' ? 11 : 10))
      .attr('font-weight', (d) => (d.kind === 'query' ? 600 : 400))

    sim.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)
      linkLabel
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2)
      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    return () => sim.stop()
  }, [data])

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-vault-border">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Memory Graph
        </h3>
        <p className="text-[10px] text-slate-500">Entities & relationships from your last query</p>
      </div>
      <div ref={holderRef} className="relative flex-1 min-h-0">
        <svg ref={svgRef} className="absolute inset-0 h-full w-full" />
        {!hasNodes && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 px-6 text-center pointer-events-none">
            Ask a question with this panel open to see the connected memories light up here.
          </div>
        )}
      </div>
    </div>
  )
}
