/**
 * QuanQn · Tailwind 配置
 *
 * 颜色派生自 ui/aurelian_dark/DESIGN.md YAML frontmatter(LD-015 权威源)
 * 字体跟 AGENTS §2.1 一致 · Manrope / Plus Jakarta Sans / Inter
 *
 * ⚠️ 不要 hardcode 颜色 · 全部走 theme('colors.X')
 * ⚠️ 不要从文字段取颜色 · YAML 优先(详见 AGENTS §3 LD-015)
 */

import animatePlugin from 'tailwindcss-animate';
const animate = animatePlugin.default ?? animatePlugin;  // CJS 包 default 兼容

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '24px',
      screens: { '2xl': '1440px' },
    },
    extend: {
      colors: {
        // === Surface(7 档 · 来自 DESIGN.md YAML) ===
        surface: '#131316',
        'surface-bright': '#39393c',
        'surface-container-lowest': '#0e0e11',
        'surface-container-low': '#1b1b1e',
        'surface-container': '#1f1f22',
        'surface-container-high': '#2a2a2d',
        'surface-container-highest': '#343437',

        'on-surface': '#e4e2e5',
        'on-surface-variant': '#d0c5af',
        'inverse-surface': '#e4e2e5',
        'inverse-on-surface': '#303033',

        // === Primary Gold(YAML 权威 · 文字段是 hover/active 变体) ===
        primary: {
          DEFAULT: '#f2ca50',
          container: '#d4af37',
          fixed: '#ffe088',
          'fixed-dim': '#e9c349',
        },
        'on-primary': '#3c2f00',
        'on-primary-container': '#554300',
        'on-primary-fixed-variant': '#574500',

        // === Secondary / Tertiary ===
        secondary: '#eac249',
        'on-secondary': '#3d2f00',
        'secondary-container': '#b08c10',

        tertiary: '#ffc551',
        'on-tertiary': '#412d00',
        'tertiary-container': '#e1aa36',

        // === Error ===
        error: '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',

        // === Outline ===
        outline: '#99907c',
        'outline-variant': '#4d4635',

        // === Background(= surface) ===
        background: '#131316',
        'on-background': '#e4e2e5',

        // === shadcn 兼容(让 shadcn/ui 默认组件能直接用) ===
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        // === DESIGN.md typography 段 ===
        display: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        label: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // === DESIGN.md typography 字号 ===
        'display-xl': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['36px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        h1: ['30px', { lineHeight: '1.3', fontWeight: '600' }],
        h2: ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '1', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      borderRadius: {
        // === DESIGN.md rounded 段 ===
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        // === 4px Rule ===
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        '2xl': '64px',
      },
      animation: {
        // === 5 个核心动效(参 ARCHITECTURE §8.8) ===
        'light-sweep': 'light-sweep 600ms ease',
        'gold-glow-pulse': 'gold-glow-pulse 1.5s ease-in-out infinite',
        'card-lift': 'card-lift 200ms ease',
        'fade-in-up': 'fade-in-up 400ms ease-out',
        shimmer: 'shimmer 1500ms linear infinite',
      },
      keyframes: {
        'light-sweep': {
          '0%': { transform: 'translateX(-100%) skewX(-20deg)', opacity: '0' },
          '50%': { opacity: '0.5' },
          '100%': { transform: 'translateX(200%) skewX(-20deg)', opacity: '0' },
        },
        'gold-glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.15)' },
          '50%': { boxShadow: '0 0 0 4px rgba(212, 175, 55, 0.3)' },
        },
        'card-lift': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      maxWidth: {
        container: '1440px',
      },
    },
  },
  plugins: [animate],
};
