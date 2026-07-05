// The LifeOS constellation mark: 3 spokes from a central node to satellites.
export default function Logo({ size = 26, darkCenters = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <line x1="20" y1="20" x2="9" y2="11" stroke="#6E68FF" strokeWidth="1.6" />
      <line x1="20" y1="20" x2="32" y2="14" stroke="#6E68FF" strokeWidth="1.6" />
      <line x1="20" y1="20" x2="18" y2="32" stroke="#6E68FF" strokeWidth="1.6" />
      <circle cx="20" cy="20" r="6" fill="#6E68FF" />
      <circle cx="9" cy="11" r="3" fill={darkCenters ? '#0B0D12' : '#EAECF2'} />
      <circle cx="32" cy="14" r="3" fill={darkCenters ? '#0B0D12' : '#EAECF2'} />
      <circle cx="18" cy="32" r="3" fill={darkCenters ? '#0B0D12' : '#EAECF2'} />
    </svg>
  )
}

export function Wordmark({ className = '' }) {
  return (
    <span className={`font-sora font-bold tracking-[-0.02em] ${className}`}>
      Life<span className="text-lavender">OS</span>
    </span>
  )
}
