/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app.js",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          black: '#000000',
          dark: '#080c0a',
          panel: '#101714',
          card: '#16221d',
          border: '#22332c',
          green: '#00e676',
          greenDark: '#00a852',
          greenDeep: '#0f3d23',
          greenLight: '#69f0ae',
        },
        warning: {
          amber: '#ffab00',
          orange: '#ff6d00',
          red: '#ff3d00',
          cardRed: '#d50000',
          yellow: '#ffd600',
        },
        snow: {
          DEFAULT: '#ffffff',
          light: '#f5f5f7',
          mute: '#a0aab2',
          dark: '#7e8b96',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 15px rgba(0, 230, 118, 0.25)',
        'glow-amber': '0 0 15px rgba(255, 171, 0, 0.25)',
        'glow-red': '0 0 15px rgba(255, 61, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
