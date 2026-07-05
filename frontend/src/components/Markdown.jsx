// Minimal markdown renderer for the subset Cognee returns: **bold**, line
// breaks, and "- " bullet lists. Avoids pulling in a full markdown dependency.

function renderInline(text, keyPrefix) {
  // Split on **bold** spans, keeping the delimiters' content.
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/)
    if (m) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-white">
          {m[1]}
        </strong>
      )
    }
    return <span key={`${keyPrefix}-t-${i}`}>{part}</span>
  })
}

export default function Markdown({ text, className = '' }) {
  const lines = String(text || '').split('\n')
  const blocks = []
  let bullets = null

  const flush = () => {
    if (bullets) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-0.5">
          {bullets}
        </ul>
      )
      bullets = null
    }
  }

  lines.forEach((raw, idx) => {
    const line = raw.replace(/\s+$/, '')
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      bullets = bullets || []
      bullets.push(<li key={`li-${idx}`}>{renderInline(bullet[1], `li-${idx}`)}</li>)
    } else if (line.trim() === '') {
      flush()
    } else {
      flush()
      blocks.push(
        <p key={`p-${idx}`} className="leading-relaxed">
          {renderInline(line, `p-${idx}`)}
        </p>
      )
    }
  })
  flush()

  return <div className={`space-y-1.5 ${className}`}>{blocks}</div>
}
