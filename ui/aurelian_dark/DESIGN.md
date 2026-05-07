---
name: Aurelian Dark
colors:
  surface: '#131316'
  surface-dim: '#131316'
  surface-bright: '#39393c'
  surface-container-lowest: '#0e0e11'
  surface-container-low: '#1b1b1e'
  surface-container: '#1f1f22'
  surface-container-high: '#2a2a2d'
  surface-container-highest: '#343437'
  on-surface: '#e4e2e5'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e4e2e5'
  inverse-on-surface: '#303033'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#eac249'
  on-secondary: '#3d2f00'
  secondary-container: '#b08c10'
  on-secondary-container: '#352800'
  tertiary: '#ffc551'
  on-tertiary: '#412d00'
  tertiary-container: '#e1aa36'
  on-tertiary-container: '#5b4000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#ffe08b'
  secondary-fixed-dim: '#eac249'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#584400'
  tertiary-fixed: '#ffdea6'
  tertiary-fixed-dim: '#f7bd48'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#131316'
  on-background: '#e4e2e5'
  surface-variant: '#343437'
typography:
  display-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1:
    fontFamily: Manrope
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
  h2:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  gutter: 24px
  container-max: 1440px
---

## Brand & Style

This design system embodies "Minimalist Luxury." It is designed for high-end SaaS platforms where precision, exclusivity, and calm authority are paramount. The aesthetic rejects the frenetic energy of typical tech startups in favor of a curated, editorial feel. 

The visual language combines **Minimalism** with **Tonal Layering**. It leverages deep, monochromatic backgrounds to allow gold accents to function as high-value signals rather than mere decoration. The interface feels physical and tactile through the use of micro-interactions, "light sweep" animations, and precise border treatments that mimic the behavior of machined metal and high-end carbon finishes.

## Colors

The palette is anchored in a "Void and Gold" philosophy. The background layers use a nearly-black charcoal and navy mix to provide maximum contrast for the gold primary tones.

- **Primary Gold:** Use #D4AF37 for interactive states, #C5A028 for active elements, and #B8860B for deep accents or hover states on dark surfaces.
- **Surface Strategy:** Use a tiered approach to depth. The `Base` is for the main application canvas, `Surface` is for sidebar or navigation containers, and `Overlay` is for cards and modal elements.
- **Borders:** Use the Graphite (#2D2D30) at low opacities (40-60%) for subtle containment.
- **Accents:** Gold is used sparingly. Implement "Gold Glow" using 10-15% opacity radial gradients behind key metrics or primary buttons to create a soft, prestigious aura.

## Typography

The typography system utilizes **Manrope** for headings to provide a geometric, modern-industrial feel. **Plus Jakarta Sans** is used for body text to introduce a slight softness that balances the sharp dark theme. **Inter** is reserved for utility labels and data-heavy tables where maximum legibility and a systematic "Pro" look are required.

Tighten letter spacing on large displays to maintain a high-fashion, editorial aesthetic. Use uppercase Inter for labels to evoke the feeling of luxury brand marking or technical instrumentation.

## Layout & Spacing

This design system employs a **Fixed-Fluid Hybrid Grid**. Layouts are contained within a 1440px max-width container, utilizing a 12-column structure. 

- **The 4px Rule:** All spacing must be a multiple of 4px. 
- **Generous Margins:** Content should "breathe" with significant vertical whitespace (using `xl` and `2xl` units) to emphasize the premium nature of the platform.
- **Rhythm:** Use 24px gutters for standard dashboard views and 16px for dense data-entry sidepanels.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Micro-Lifts** rather than heavy shadows.

- **Stacking:** The background moves from dark (#0A0A0B) to lighter (#1C1C1E) as elements move closer to the user.
- **Borders as Light:** Instead of traditional shadows, use 1px inner borders with a top-down light source bias. A subtle `linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)` on the top edge of cards creates a sharp, machined-edge look.
- **Shadows:** Use a single, highly-diffused ambient shadow for overlays: `0 20px 40px rgba(0,0,0,0.4)`. No colored shadows except for the "Gold Glow" focus state, which uses a soft `#D4AF37` blur (20-30px) at 10% opacity.

## Shapes

The design system uses **Soft (0.25rem)** as the default radius. This choice reflects a balance between the precision of sharp corners and the modern friendliness of rounded corners.

- **Standard Elements:** Buttons and Inputs use 4px (`rounded`).
- **Containers:** Large cards and Modals use 8px (`rounded-lg`).
- **Interactive States:** Hovering over a list item should trigger a 4px rounded background highlight.
- **Icons:** Icons should be 20px or 24px, using a 1.5px or 2px stroke weight to match the refined typography.

## Components

### Buttons
- **Primary:** Background #D4AF37, Text #0A0A0B (Black). Include a "light sweep" animation on hover—a 45-degree white gradient stripe that moves across the button.
- **Secondary:** Transparent background with a #2D2D30 border. On hover, the border brightens to #D4AF37.
- **Tertiary/Ghost:** Text-only with Gold #D4AF37 on hover.

### Cards
- Background: #1C1C1E.
- Border: 1px solid #2D2D30.
- Interaction: On hover, the card should lift -2px and the border opacity should increase.

### Inputs
- Background: #0A0A0B (sunken feel).
- Border: 1px solid #2D2D30. 
- Focus state: Border changes to #D4AF37 with a 2px outer glow of the same color at 15% opacity.

### Navigation
- Sidebar: Background #141416. 
- Active Link: A vertical 2px gold line on the far left of the nav item, with a subtle #D4AF37 text color change.

### Icons
- Use Lucide SVG icons only. Stroke should be consistent throughout. Avoid filled icons unless used for a specific "Active" state indicator.