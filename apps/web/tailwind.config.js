/**
 * QuanAn · Tailwind 配置
 *
 * 颜色全部派生自 ui/aurelian_dark/DESIGN.md YAML frontmatter(LD-015 权威源)
 * 字体跟 AGENTS §2.1 一致 · Manrope / Plus Jakarta Sans / Inter
 *
 * ⚠️ 不要 hardcode 颜色 · 全部走 tokens.colors.X
 * ⚠️ YAML 优先于文字段(LD-015 · text section 中的颜色值不作数)
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import animatePlugin from 'tailwindcss-animate';
import { parseTokensFromFile } from './src/lib/parseDesignTokens.js';

const animate = animatePlugin.default ?? animatePlugin;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pass explicit path so tests can override; tailwind runs from apps/web/
const tokens = parseTokensFromFile(
  path.resolve(__dirname, '../../ui/aurelian_dark/DESIGN.md')
);
const c = tokens.colors;

/** Convert a 6-char hex color to rgba(r, g, b, alpha) without hardcoding hex literals. */
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
        // === Surface (DESIGN.md YAML) ===
        surface: c['surface'],
        'surface-dim': c['surface-dim'],
        'surface-bright': c['surface-bright'],
        'surface-container-lowest': c['surface-container-lowest'],
        'surface-container-low': c['surface-container-low'],
        'surface-container': c['surface-container'],
        'surface-container-high': c['surface-container-high'],
        'surface-container-highest': c['surface-container-highest'],

        'on-surface': c['on-surface'],
        'on-surface-variant': c['on-surface-variant'],
        'inverse-surface': c['inverse-surface'],
        'inverse-on-surface': c['inverse-on-surface'],

        // === Primary Gold (YAML is authoritative · text section lists hover/active variants) ===
        primary: {
          DEFAULT: c['primary'],
          container: c['primary-container'],
          fixed: c['primary-fixed'],
          'fixed-dim': c['primary-fixed-dim'],
        },
        'on-primary': c['on-primary'],
        'on-primary-container': c['on-primary-container'],
        'inverse-primary': c['inverse-primary'],
        'on-primary-fixed-variant': c['on-primary-fixed-variant'],

        // === Secondary / Tertiary ===
        secondary: c['secondary'],
        'on-secondary': c['on-secondary'],
        'secondary-container': c['secondary-container'],

        tertiary: c['tertiary'],
        'on-tertiary': c['on-tertiary'],
        'tertiary-container': c['tertiary-container'],

        // === Error ===
        error: c['error'],
        'on-error': c['on-error'],
        'error-container': c['error-container'],
        'on-error-container': c['on-error-container'],

        // === Outline ===
        outline: c['outline'],
        'outline-variant': c['outline-variant'],

        // === Background ===
        background: c['background'],
        'on-background': c['on-background'],

        // === Misc ===
        'surface-tint': c['surface-tint'],
        'surface-variant': c['surface-variant'],

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
        display: ['Orbitron', 'Rajdhani', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        label: ['Rajdhani', 'Noto Sans SC', 'system-ui', 'sans-serif'],
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
        // === DESIGN.md rounded segment ===
        sm: String(tokens.rounded['sm']),
        DEFAULT: String(tokens.rounded['DEFAULT']),
        md: String(tokens.rounded['md']),
        lg: String(tokens.rounded['lg']),
        xl: String(tokens.rounded['xl']),
        full: String(tokens.rounded['full']),
      },
      spacing: {
        // === DESIGN.md spacing (4px Rule) ===
        xs: String(tokens.spacing['xs']),
        sm: String(tokens.spacing['sm']),
        md: String(tokens.spacing['md']),
        lg: String(tokens.spacing['lg']),
        xl: String(tokens.spacing['xl']),
        '2xl': String(tokens.spacing['2xl']),
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
          '0%, 100%': { boxShadow: `0 0 0 2px ${hexToRgba(c['primary'], 0.15)}` },
          '50%': { boxShadow: `0 0 0 4px ${hexToRgba(c['primary'], 0.3)}` },
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
