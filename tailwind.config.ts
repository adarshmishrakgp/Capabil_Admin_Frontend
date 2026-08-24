import type { Config } from 'tailwindcss';

/**
 * Light workspace, dark navigation — the classic admin split.
 * Content sits on white/near-white so data is easy to read for long stretches;
 * the sidebar stays deep plum so the CapabilIQ brand still frames the product,
 * and violet→magenta is reserved for actions, states and charts.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f2fd',
          100: '#ebe4fb',
          200: '#d7c9f7',
          300: '#b9a2ef',
          400: '#9673e4',
          500: '#7b4fd6',
          600: '#6d4ac8',
          700: '#5b3aa8',
          800: '#4b3189',
          900: '#3f2b70',
        },
        accent: {
          400: '#d06bb4',
          500: '#c4569f',
          600: '#b94a9c',
          700: '#9b3c81',
        },
        ink: {
          50: '#f7f7fa',
          100: '#eeeef3',
          200: '#e3e3ec',
          300: '#cbcbd9',
          400: '#9797ab',
          500: '#6c6c82',
          600: '#4d4d61',
          700: '#37374a',
          800: '#242433',
          900: '#14141f',
        },
        // navigation surface
        night: {
          DEFAULT: '#1a0f20',
          raised: '#241531',
          border: 'rgb(255 255 255 / 0.10)',
          muted: '#a393ad',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,20,31,.04), 0 4px 16px -8px rgba(20,20,31,.10)',
        pop: '0 10px 34px -10px rgba(20,20,31,.24)',
        glow: '0 6px 20px -8px rgba(109,74,200,.55)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      backgroundImage: {
        brand: 'linear-gradient(105deg,#6d4ac8 0%,#8b47bc 55%,#b94a9c 100%)',
        night: 'linear-gradient(180deg,#1f1228 0%,#170d1d 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
