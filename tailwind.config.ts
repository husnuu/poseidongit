import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Poseidon ana lacivert/mavi — önceden admin panelinde ~60 yerde
        // #2168b8 olarak tekrar tekrar yazılıyordu. Artık tek bir token:
        // globals.css'teki gerçek --primary CSS değişkenine referans verir,
        // böylece marka rengi tek bir yerden değişebilir.
        primary: 'var(--primary)',
        'primary-dark': '#1b5697',
      },
    },
  },
  plugins: [],
}
export default config
