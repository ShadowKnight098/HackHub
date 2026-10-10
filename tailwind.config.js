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
        moss:     'var(--moss)',
        sun:      'var(--sun)',
        sky:      'var(--sky)',
        n1:       'var(--n1)',
        n2:       'var(--n2)',
        n3:       'var(--n3)',
      },
      fontFamily: {
        heading:  ['Fraunces', 'serif'],
        body:     ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        accent:   ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      borderRadius: {
        card:   '10px',
        btn:    '8px',
        note:   '6px',
      },
      boxShadow: {
        soft:   '0 12px 32px -22px rgba(20, 24, 40, 0.5)',
        note:   '0 10px 24px -18px rgba(20, 24, 40, 0.4)',
      },
      letterSpacing: {
        primaryBtn: '0.02em',
        accentLabel: '0.01em',
      },
    },
  },
  darkMode: ["selector", '[data-theme="dark"]'],
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: '#f4f1ea',
            foreground: '#1f2430',
            default: {
              DEFAULT: '#ddd7ca',
              100: '#fdfcf9',
              200: '#ddd7ca',
              300: '#c5bfb0',
              foreground: '#1f2430',
            },
            primary: {
              DEFAULT: '#7b2d3b',
              foreground: '#f4f1ea',
            },
            focus: '#7b2d3b',
          },
        },
        dark: {
          colors: {
            background: '#14161c',
            foreground: '#efeae0',
            default: {
              DEFAULT: '#2e323d',
              100: '#1c1f27',
              200: '#2e323d',
              300: '#404554',
              foreground: '#efeae0',
            },
            primary: {
              DEFAULT: '#d98a9a',
              foreground: '#14161c',
            },
            focus: '#d98a9a',
          },
        },
      },
    }),
  ],
};
