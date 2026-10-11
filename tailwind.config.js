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
        lime:     '#B9FF66',
        dark:     '#191A23',
        grey:     '#F3F3F3',
        moss:     'var(--moss)',
        sun:      'var(--sun)',
        sky:      'var(--sky)',
        n1:       'var(--n1)',
        n2:       'var(--n2)',
        n3:       'var(--n3)',
      },
      fontFamily: {
        heading:  ['"Space Grotesk"', 'sans-serif'],
        body:     ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        accent:   ['"Space Grotesk"', 'sans-serif'],
      },
      borderRadius: {
        card:   '24px',
        btn:    '12px',
        note:   '16px',
      },
      boxShadow: {
        solid:  '0 5px 0 #191A23',
        solidSm: '0 3px 0 #191A23',
        soft:   '0 12px 32px -22px rgba(25, 26, 35, 0.15)',
        note:   '0 5px 0 #191A23',
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
            background: '#FFFFFF',
            foreground: '#191A23',
            default: {
              DEFAULT: '#191A23',
              100: '#F3F3F3',
              200: '#E5E5E5',
              300: '#191A23',
              foreground: '#191A23',
            },
            primary: {
              DEFAULT: '#191A23',
              foreground: '#FFFFFF',
            },
            focus: '#B9FF66',
          },
        },
      },
    }),
  ],
};
