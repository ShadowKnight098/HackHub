import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx,mjs}",
    "./node_modules/@heroui/react/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx,mjs}",
    "./node_modules/@heroui/**/*.{js,ts,jsx,tsx,mjs}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       'var(--bg)',
        surface:  'var(--surface)',
        ink:      'var(--ink)',
        muted:    'var(--muted)',
        line:     'var(--line)',
        accent:   'var(--accent)',
        primary: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          DEFAULT: '#4F46E5',
        },
        lime:     '#10B981',
        dark:     '#0F172A',
        grey:     '#F8FAFC',
        moss:     '#0D9488',
        sun:      '#F59E0B',
        sky:      '#0284C7',
        n1:       'var(--n1)',
        n2:       'var(--n2)',
        n3:       'var(--n3)',
      },
      fontFamily: {
        heading:  ['"Plus Jakarta Sans"', '"Space Grotesk"', 'sans-serif'],
        body:     ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        accent:   ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        card:   '16px',
        btn:    '10px',
        note:   '14px',
      },
      boxShadow: {
        soft:      '0 2px 10px -2px rgba(15, 23, 42, 0.04), 0 1px 3px -1px rgba(15, 23, 42, 0.02)',
        card:      '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        cardHover: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        elevated:  '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        note:      '0 2px 8px -2px rgba(15, 23, 42, 0.06)',
      },
      letterSpacing: {
        primaryBtn: '-0.01em',
        accentLabel: '-0.01em',
      },
    },
  },
  darkMode: ["selector", '[data-theme="dark"]'],
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: '#F8FAFC',
            foreground: '#0F172A',
            default: {
              DEFAULT: '#0F172A',
              100: '#F1F5F9',
              200: '#E2E8F0',
              300: '#CBD5E1',
              foreground: '#0F172A',
            },
            primary: {
              DEFAULT: '#4F46E5',
              foreground: '#FFFFFF',
            },
            focus: '#4F46E5',
          },
        },
      },
    }),
  ],
};
