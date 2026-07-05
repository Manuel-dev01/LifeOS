export default function ViewHeader({ title, subtitle, right }) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 border-b border-[#e2e4ea] shrink-0">
      <div className="min-w-0">
        <h1 className="text-[18px] md:text-[20px] font-semibold text-ink-900 truncate">{title}</h1>
        {subtitle && <p className="font-mono text-[11px] text-[#9aa3b2] mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="shrink-0">{right}</div>
    </header>
  )
}
