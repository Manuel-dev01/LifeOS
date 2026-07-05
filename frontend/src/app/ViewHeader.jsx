export default function ViewHeader({ title, subtitle, right }) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-[#e2e4ea] shrink-0">
      <div>
        <h1 className="text-[20px] font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="font-mono text-[11px] text-[#9aa3b2] mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
