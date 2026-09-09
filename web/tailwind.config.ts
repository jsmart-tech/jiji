import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../shared/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00B53F',
          dark: '#00872E',
          light: '#E6F8EC',
        },
        accent: {
          DEFAULT: '#FFC800',
          dark: '#E0AF00',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F5F7',
          border: '#E5E7EB',
        },
        ink: {
          DEFAULT: '#1A1D1F',
          muted: '#6B7280',
        },
        danger: {
          DEFAULT: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)',
        popover: '0 8px 24px rgba(16, 24, 40, 0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
