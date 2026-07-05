// Minimal markdown renderer for what Cognee returns: **bold**, *italic*,
// `code`, headings, and nested "- "/"* " bullet lists. Bold INHERITS the
// surrounding text color (never forces white — the answer card is light).

function renderInline(text, kp) {
  // Split on **bold**, *italic*, and `code`, keeping delimiters.
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.filter(Boolean).map((part, i) => {
    let m
    if ((m = part.match(/^\*\*([^*]+)\*\*$/))) {
      return (
        <strong key={`${kp}-b-${i}`} className="font-semibold">
          {m[1]}
        </strong>
      )
    }
    if ((m = part.match(/^\*([^*]+)\*$/))) {
      return <em key={`${kp}-i-${i}`}>{m[1]}</em>
    }
    if ((m = part.match(/^`([^`]+)`$/))) {
      return (
        <code key={`${kp}-c-${i}`} className="px-1 py-0.5 rounded bg-black/[0.06] text-[0.9em] font-mono">
          {m[1]}
        </code>
      )
    }
    return <span key={`${kp}-t-${i}`}>{part}</span>
  })
}

// Parse a bullet list starting at `start`, consuming lines whose indent is >=
// `indent`. Deeper-indented runs recurse into a nested <ul>. Returns [node, nextIndex].
function parseList(lines, start, indent, keyBase) {
  const items = []
  let i = start
  while (i < lines.length) {
    const raw = lines[i]
    if (raw.trim() === '') {
      i++
      continue
    } // blank lines don't break the list
    const m = raw.match(/^(\s*)[-*+]\s+(.*)$/)
    if (!m) break
    const ind = m[1].length
    if (ind < indent) break
    if (ind > indent) break // handled by the parent's child-scan below
    const content = m[2]
    i++
    // scan for a deeper-indented child list immediately following
    let children = null
    let j = i
    while (j < lines.length && lines[j].trim() === '') j++
    const next = j < lines.length ? lines[j].match(/^(\s*)[-*+]\s+/) : null
    if (next && next[1].length > indent) {
      const [childUl, nj] = parseList(lines, j, next[1].length, `${keyBase}-${i}`)
      children = childUl
      i = nj
    }
    items.push(
      <li key={`${keyBase}-li-${i}`}>
        {renderInline(content, `${keyBase}-${i}`)}
        {children}
      </li>
    )
  }
  return [
    <ul key={`${keyBase}-ul-${start}`} className="list-disc pl-5 space-y-1 marker:text-[#b9bece]">
      {items}
    </ul>,
    i,
  ]
}

export default function Markdown({ text, className = '' }) {
  const lines = String(text || '').replace(/\r/g, '').split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.replace(/\s+$/, '')

    if (line.trim() === '') {
      i++
      continue
    }

    // ATX heading (#, ##, ###)
    const h = line.match(/^\s*(#{1,3})\s+(.*)$/)
    if (h) {
      const size = h[1].length === 1 ? 'text-[16px]' : 'text-[15px]'
      blocks.push(
        <div key={`h-${i}`} className={`${size} font-semibold mt-1`}>
          {renderInline(h[2], `h-${i}`)}
        </div>
      )
      i++
      continue
    }

    // bullet list (any indent) -> nested parser
    const b = line.match(/^(\s*)[-*+]\s+/)
    if (b) {
      const [ul, ni] = parseList(lines, i, b[1].length, `l${i}`)
      blocks.push(ul)
      i = ni
      continue
    }

    // a bold-only line reads like a sub-heading
    if (/^\*\*[^*]+\*\*:?\s*$/.test(line.trim())) {
      blocks.push(
        <div key={`sh-${i}`} className="font-semibold mt-1">
          {renderInline(line.trim().replace(/:$/, ''), `sh-${i}`)}
        </div>
      )
      i++
      continue
    }

    // paragraph
    blocks.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {renderInline(line, `p-${i}`)}
      </p>
    )
    i++
  }

  return <div className={`space-y-2 ${className}`}>{blocks}</div>
}
