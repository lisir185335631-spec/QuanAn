/**
 * QuanAn · Tailwind 配置 — 先锋白·工业精密版
 *
 * 颜色/圆角/间距已硬编码为先锋白(克莱因蓝 #002fa7 / 白底 / 深字)。
 * 原 aiipznt 暗金来源 ui/aurelian_dark/DESIGN.md 已解耦并删除。
 * 字体:Manrope(display/label/sans)· Noto Sans SC(cn)。
 */

import animatePlugin from 'tailwindcss-animate';

const animate = animatePlugin.default ?? animatePlugin;

/** Convert a 6-char hex color to rgba(r, g, b, alpha). */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
        // === Surface · 先锋白 re-skin(原 c[...] 暗金 → 白底浅灰阶 · DESIGN.md 不动)===
        surface: '#ffffff',
        'surface-dim': '#f3f4f6',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f8f9fa',
        'surface-container': '#f3f4f6',
        'surface-container-high': '#eceef2',
        'surface-container-highest': '#e5e7eb',

        'on-surface': '#111827',
        'on-surface-variant': '#6b7280',
        'inverse-surface': '#1b1b1b',
        'inverse-on-surface': '#f8f9fa',

        // === Primary · 克莱因蓝 #002fa7(原暗金）===
        primary: {
          DEFAULT: '#002fa7',
          container: '#e0e7ff',
          fixed: '#dbe3ff',
          'fixed-dim': '#bcc9f5',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#001e73',
        'inverse-primary': '#bcc9f5',
        'on-primary-fixed-variant': '#001e73',

        // === Secondary / Tertiary ===
        secondary: '#f3f4f6',
        'on-secondary': '#374151',
        'secondary-container': '#e5e7eb',

        tertiary: '#781621',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#f7e7ea',

        // === Error · 勃艮第红系 ===
        error: '#9a2233',
        'on-error': '#ffffff',
        'error-container': '#fdecef',
        'on-error-container': '#781621',

        // === Outline ===
        outline: '#c4c5d6',
        'outline-variant': '#e5e7eb',

        // === Background ===
        background: '#ffffff',
        'on-background': '#111827',

        // === Misc ===
        'surface-tint': '#002fa7',
        'surface-variant': '#f3f4f6',

        // === shadcn/ui CSS-var tokens (reference CSS custom properties, not hex) ===
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
        // === aiipznt alignment · PRD-16 US-001 ===
        display: ['Manrope', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        label: ['Manrope', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        cn: ['Noto Sans SC', 'system-ui', 'sans-serif'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // === DESIGN.md typography scale ===
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
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        '2xl': '64px',
      },
      animation: {
        // === ARCHITECTURE §8.8 core animations ===
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
          '0%, 100%': { boxShadow: `0 0 0 2px ${hexToRgba('#002fa7', 0.15)}` },
          '50%': { boxShadow: `0 0 0 4px ${hexToRgba('#002fa7', 0.3)}` },
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
