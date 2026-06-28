/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        'comun-black':   '#080e18',
        'comun-charcoal':'#0e1525',
        'comun-navy':    '#0a1525',
        'comun-navy-mid':'#122030',
        'comun-teal':    '#5BB8D4',
        'comun-gold':    '#C9A84C',
        'comun-gold-light': '#E2C27D',
        'comun-gold-dark':  '#9A7A32',
        'comun-white':   '#F5F0E8',
        'comun-muted':   '#8a8a8a',
        'comun-orange':  '#D4722A',
        // Legacy aliases for compatibility
        primary: {
          DEFAULT: '#080e18',
          light: '#0e1525',
          mid: '#1a2a3a',
        },
        accent: {
          DEFAULT: '#C9A84C',
          light: '#E2C27D',
        },
        muted: '#8a8a8a',
        danger: '#c0392b',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero':    ['clamp(3rem, 8vw, 7rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display': ['clamp(2rem, 5vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'section': ['clamp(1.75rem, 3.5vw, 3rem)', { lineHeight: '1.15' }],
      },
      backgroundImage: {
        'gold-gradient':  'linear-gradient(135deg, #C9A84C 0%, #E2C27D 50%, #9A7A32 100%)',
        'dark-gradient':  'linear-gradient(180deg, #0a0a0a 0%, #0d1b2a 50%, #0a0a0a 100%)',
        'radial-gold':    'radial-gradient(ellipse at center, rgba(201,168,76,0.15) 0%, transparent 70%)',
        'radial-navy':    'radial-gradient(ellipse at top, rgba(13,27,42,0.8) 0%, transparent 60%)',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.8' },
        },
        'scroll-bounce': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '1' },
          '50%':      { transform: 'translateY(6px)', opacity: '0.4' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'float':         'float 6s ease-in-out infinite',
        'pulse-gold':    'pulse-gold 3s ease-in-out infinite',
        'scroll-bounce': 'scroll-bounce 2s ease-in-out infinite',
        'shimmer':       'shimmer 3s linear infinite',
        'fade-in-up':    'fade-in-up 0.6s ease-out forwards',
      },
      boxShadow: {
        'gold':     '0 0 40px rgba(201,168,76,0.25)',
        'gold-sm':  '0 0 20px rgba(201,168,76,0.15)',
        'gold-lg':  '0 0 80px rgba(201,168,76,0.3)',
        'glass':    '0 8px 32px rgba(0,0,0,0.4)',
        'card':     '0 4px 24px rgba(0,0,0,0.5)',
        'card-hover':'0 12px 48px rgba(0,0,0,0.7)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
