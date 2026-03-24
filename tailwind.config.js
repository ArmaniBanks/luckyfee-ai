/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bags: { primary: '#00E5A0', secondary: '#00C48C', dark: '#0A0F1C', card: '#111827', border: '#1E293B', muted: '#64748B', accent: '#6366F1', warning: '#F59E0B', danger: '#EF4444' },
      },
      fontFamily: {
        display: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: { float: 'float 6s ease-in-out infinite' },
      keyframes: { float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } } },
    },
  },
  plugins: [],
};
