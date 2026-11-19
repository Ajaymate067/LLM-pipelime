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
        cyber: {
          dark: '#030712',
          navy: '#090d16',
          panel: 'rgba(13, 20, 36, 0.75)',
          panelLight: 'rgba(255, 255, 255, 0.85)',
          border: 'rgba(56, 189, 248, 0.2)',
          borderHover: 'rgba(56, 189, 248, 0.5)',
          cyan: '#06b6d4',
          neonCyan: '#22d3ee',
          violet: '#8b5cf6',
          neonViolet: '#a855f7',
          pink: '#ec4899',
          amber: '#f59e0b',
          emerald: '#10b981',
          accent: '#38bdf8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(34, 211, 238, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(34, 211, 238, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}

