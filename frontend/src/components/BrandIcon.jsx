// Official brand marks (inline SVG, no network) for the connector cards.
// Keys match the /connectors card keys used in Onboarding and SourcesView.

function Gmail({ s }) {
  return (
    <svg viewBox="0 0 48 48" width={s} height={s} aria-label="Gmail">
      <path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75L35 40h7a3 3 0 0 0 3-3V16.2z" />
      <path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6a3 3 0 0 1-3-3V16.2z" />
      <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
      <path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859A3.995 3.995 0 0 0 7.298 8 4.298 4.298 0 0 0 3 12.298z" />
      <path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341A3.995 3.995 0 0 1 40.702 8 4.298 4.298 0 0 1 45 12.298z" />
    </svg>
  )
}

function Calendar({ s }) {
  return (
    <svg viewBox="0 0 48 48" width={s} height={s} aria-label="Google Calendar">
      <rect width="22" height="22" x="13" y="13" fill="#fff" />
      <polygon fill="#1e88e5" points="25.68,20.92 26.688,22.36 28.272,21.208 28.272,29.56 30,29.56 30,18.616 28.56,18.616" />
      <path
        fill="#1e88e5"
        d="M22.943 23.745c.625-.574 1.013-1.37 1.013-2.249 0-1.747-1.533-3.168-3.417-3.168-1.602 0-2.972 1.009-3.33 2.453l1.657.421c.166-.669.834-1.146 1.673-1.146.941 0 1.709.646 1.709 1.44 0 .794-.767 1.44-1.709 1.44h-.997v1.728h.997c1.081 0 1.993.751 1.993 1.64 0 .904-.866 1.64-1.931 1.64-.962 0-1.784-.61-1.914-1.418l-1.756.29c.263 1.64 1.784 2.855 3.67 2.855 2.05 0 3.719-1.515 3.719-3.377 0-1.117-.493-2.32-1.3-3.295z"
      />
      <polygon fill="#fbc02d" points="34,42 14,42 13,38 14,34 34,34 35,38" />
      <polygon fill="#4caf50" points="38,35 42,34 42,14 38,13 34,14 34,34" />
      <path fill="#1e88e5" d="M34 14l1-4-1-4H9a3 3 0 0 0-3 3v25l4 1 4-1V14h20z" />
      <polygon fill="#e53935" points="34,34 34,42 42,34" />
      <path fill="#1565c0" d="M39 6h-5v8h8V9a3 3 0 0 0-3-3z" />
      <path fill="#2e7d32" d="M9 42h5v-8H6v5a3 3 0 0 0 3 3z" />
    </svg>
  )
}

function Drive({ s }) {
  return (
    <svg viewBox="0 0 48 48" width={s} height={s} aria-label="Google Drive">
      <polygon fill="#ffc107" points="17,6 31,6 45,30 31,30" />
      <polygon fill="#1976d2" points="9.875,42 16.938,30 45,30 38,42" />
      <polygon fill="#4caf50" points="3,30.125 9.875,42 24,18 17,6" />
    </svg>
  )
}

function Notion({ s }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} aria-label="Notion">
      <rect width="24" height="24" rx="4" fill="#fff" />
      <path
        fill="#000"
        d="M4.66 5.02l9.9-.73c1.22-.1 1.53-.03 2.3.53l3.16 2.22c.52.38.7.49.7.9v12.2c0 .76-.28 1.21-1.25 1.28l-11.5.7c-.73.03-1.08-.07-1.46-.56L4.1 18.24c-.42-.56-.59-.97-.59-1.46V6.28c0-.62.28-1.14 1.15-1.26z"
        transform="scale(0.82) translate(2.2 1.6)"
      />
      <path
        fill="#fff"
        d="M14.56 4.29l-9.9.73C3.8 5.14 3.5 5.66 3.5 6.28v10.5c0 .49.17.9.59 1.46l2.4 3.05c.38.49.73.59 1.46.56l11.5-.7c.97-.07 1.25-.52 1.25-1.28V7.94c0-.39-.15-.5-.6-.83l-3.26-2.29c-.77-.56-1.08-.63-2.3-.53zM8.2 8.08c-.94.06-1.15.08-1.68-.35L5.2 6.66c-.14-.14-.07-.31.28-.35l9.52-.7c.8-.07 1.22.21 1.53.45l1.57 1.13c.07.04.24.24.03.24l-9.82.59-.13-.01zm-.35 10.3V9.53c0-.45.14-.66.55-.7l11.29-.66c.38-.03.55.21.55.66v9.65c0 .45-.07.83-.69.87l-10.8.63c-.62.03-.9-.17-.9-.72zm10.44-8.13c.07.31 0 .62-.31.66l-.52.1v7.63c-.45.24-.87.38-1.22.38-.55 0-.69-.17-1.11-.69l-3.4-5.34v5.17l1.08.24s0 .62-.87.62l-2.39.14c-.07-.14 0-.48.24-.55l.62-.17V11.4l-.87-.07c-.07-.31.1-.76.59-.8l2.57-.17 3.54 5.41v-4.79l-.9-.1c-.07-.38.21-.66.55-.69z"
      />
    </svg>
  )
}

function Slack({ s }) {
  return (
    <svg viewBox="0 0 48 48" width={s} height={s} aria-label="Slack">
      <path fill="#33d375" d="M33 8a4 4 0 0 0-8 0c0 1.254 0 9.741 0 11a4 4 0 0 0 8 0c0-1.259 0-9.746 0-11z" />
      <path fill="#33d375" d="M43 19a4 4 0 0 1-4 4c-1.195 0-4 0-4 0s0-2.986 0-4a4 4 0 0 1 8 0z" />
      <path fill="#40c4ff" d="M8 14a4 4 0 0 0 0 8c1.254 0 9.741 0 11 0a4 4 0 0 0 0-8C17.741 14 9.254 14 8 14z" />
      <path fill="#40c4ff" d="M4 19a4 4 0 0 1 4-4c1.195 0 4 0 4 0s0 2.986 0 4a4 4 0 0 1-8 0z" transform="translate(11 -11)" />
      <path fill="#e91e63" d="M15 40a4 4 0 0 0 8 0c0-1.254 0-9.741 0-11a4 4 0 0 0-8 0c0 1.259 0 9.746 0 11z" />
      <path fill="#e91e63" d="M5 29a4 4 0 0 1 4-4c1.195 0 4 0 4 0s0 2.986 0 4a4 4 0 0 1-8 0z" />
      <path fill="#ffc107" d="M40 34a4 4 0 0 0 0-8c-1.254 0-9.741 0-11 0a4 4 0 0 0 0 8c1.259 0 9.746 0 11 0z" />
      <path fill="#ffc107" d="M29 44a4 4 0 0 1-4-4c0-1.195 0-4 0-4s2.986 0 4 0a4 4 0 0 1 0 8z" />
    </svg>
  )
}

function Apple({ s }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="#1d1d1f" aria-label="Apple Notes">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

const MARKS = { gmail: Gmail, calendar: Calendar, drive: Drive, notion: Notion, slack: Slack, apple_notes: Apple }

// Some cards want the raw glyph; most want it on a neutral tile so multicolor
// marks read well on both light and dark backgrounds.
export default function BrandIcon({ name, size = 20, tile = false, className = '' }) {
  const Mark = MARKS[name]
  if (!Mark) return null
  if (!tile) return <Mark s={size} />
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-white border border-black/5 ${className}`}
      style={{ width: size + 12, height: size + 12 }}
    >
      <Mark s={size} />
    </span>
  )
}
