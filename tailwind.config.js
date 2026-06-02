/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: 'var(--bg-space)',
        surface: 'var(--bg-surface)',
        'surface-lit': 'var(--bg-surface-lit)',
        accent: 'var(--accent-violet)',
        glow: 'var(--accent-glow)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        success: 'var(--status-green)',
        warning: 'var(--status-yellow)',
        danger: 'var(--status-red)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
