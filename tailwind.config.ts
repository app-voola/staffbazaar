import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ember: { DEFAULT: '#DC4A1A', light: '#F97316' },
        gold: { DEFAULT: '#D97706', light: '#FEF3C7' },
        charcoal: { DEFAULT: '#1C1917', mid: '#44403C', light: '#78716C' },
        cream: '#F5F5F4',
        sand: '#E2E0DE',
        stone: '#A8A29E',
        green: { DEFAULT: '#16A34A', light: '#DCFCE7', dark: '#15803D' },
        blue: { DEFAULT: '#2563EB', light: '#DBEAFE' },
        'warm-white': '#F5F0EB',
      },
      borderRadius: { sm: '8px', md: '12px', lg: '20px', xl: '28px' },
    },
  },
  plugins: [],
};
export default config;
