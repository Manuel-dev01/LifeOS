/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand / accents (from the design mockups)
        brand: '#4A44E6', // primary indigo (buttons, CTAs)
        node: '#6E68FF', // node indigo / email accent
        lavender: '#8b86ff', // person nodes, italic accents, active states
        meeting: '#5cbf9a', // green
        'meeting-dk': '#2f8f6b',
        note: '#d9a24a', // amber
        'note-dk': '#c08a34',
        danger: '#c0392b',
        // Dark surfaces
        ink: '#0B0D12', // page / onboarding bg
        'ink-side': '#0F1118', // sidebar
        'ink-card': '#12141c', // dark cards / graph
        'ink-900': '#13151B', // near-black text / user bubble
        // Light surfaces
        paper: '#F4F5F8', // app main
        'paper-2': '#E7E9EF', // page behind window
        // Text
        mist: '#EAECF2',
        'mist-bright': '#F6F7FB',
        muted: '#8b90a0',
        'muted-2': '#9aa0b2',
        faint: '#565d6b',
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        sora: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        marqueeX: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        floaty: 'floaty 7s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        marqueeX: 'marqueeX 32s linear infinite',
        blink: 'blink 1s step-end infinite',
        fadeUp: 'fadeUp 0.5s cubic-bezier(.2,.7,.2,1) both',
        spin: 'spin 1.1s linear infinite',
      },
    },
  },
  plugins: [],
}
