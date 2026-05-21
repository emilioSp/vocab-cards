/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#fbf6ee', 100: '#fbf6ee', 200: '#f3ecdf' },
        ink: { DEFAULT: '#2b1d12', 700: '#2b1d12', 500: '#5a4a3a', 300: '#9a8a78' },
        accent: { DEFAULT: '#e07a5f', 600: '#c8624a' },
        good: { DEFAULT: '#7ca982', 700: '#5d8a64' },
        bad: { DEFAULT: '#d97766', 700: '#b85a4a' },
        peach: '#f7c59f',
        sage: '#bcd4b6',
        lav: '#d4c5e2',
        sky: '#bcd6e2',
        butter: '#f4e1a0',
        rose: '#f0c6c0',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 0 rgba(43,29,18,.05), 0 1px 2px rgba(43,29,18,.04)',
        pop:  '0 1px 0 rgba(43,29,18,.05), 0 8px 20px -8px rgba(43,29,18,.18)',
        big:  '0 1px 0 rgba(255,255,255,.7) inset, 0 30px 60px -30px rgba(43,29,18,.35), 0 12px 30px -16px rgba(43,29,18,.25)',
        accent: '0 1px 0 rgba(255,255,255,.25) inset, 0 8px 20px -8px rgba(224,122,95,.6)',
        ink:    '0 1px 0 rgba(255,255,255,.12) inset, 0 6px 16px -6px rgba(43,29,18,.5)',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pop:       { '0%': { transform: 'translateY(12px) scale(.97)', opacity: '0' }, '100%': { transform: 'none', opacity: '1' } },
        flashGood: { '0%': { boxShadow: '0 0 0 0 rgba(124,169,130,.6)' }, '100%': { boxShadow: '0 0 0 30px rgba(124,169,130,0)' } },
        flashBad:  { '0%': { boxShadow: '0 0 0 0 rgba(217,119,102,.6)' }, '100%': { boxShadow: '0 0 0 30px rgba(217,119,102,0)' } },
      },
      animation: {
        fadeIn:    'fadeIn .18s ease',
        pop:       'pop .22s cubic-bezier(.2,.9,.3,1.2)',
        flashGood: 'flashGood .6s ease-out',
        flashBad:  'flashBad .6s ease-out',
      },
    },
  },
  plugins: [],
}
