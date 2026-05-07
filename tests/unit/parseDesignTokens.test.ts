import { describe, it, expect } from 'vitest';
import { parseTokensFromContent } from '../../apps/web/src/lib/parseDesignTokens.js';

const VALID_DESIGN_MD = `---
name: Test Design
colors:
  surface: '#1a1a1a'
  primary: '#f2ca50'
  background: '#131316'
  on-background: '#e4e2e5'
typography:
  h1:
    fontFamily: Manrope
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  lg: 0.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
---

## Text section (ignored per LD-015 YAML-wins rule)

Colors mentioned in text like #D4AF37 and #C5A028 are editorial hints, not tokens.
Primary Gold: Use #D4AF37 for interactive states, #C5A028 for active elements.
`;

describe('parseTokensFromContent', () => {
  it('extracts color tokens from YAML frontmatter', () => {
    const tokens = parseTokensFromContent(VALID_DESIGN_MD);
    expect(tokens.colors['surface']).toBe('#1a1a1a');
    expect(tokens.colors['primary']).toBe('#f2ca50');
    expect(tokens.colors['background']).toBe('#131316');
  });

  it('extracts typography tokens including all three font families', () => {
    const tokens = parseTokensFromContent(VALID_DESIGN_MD);
    expect(tokens.typography['h1']?.fontFamily).toBe('Manrope');
    expect(tokens.typography['body-md']?.fontFamily).toBe('Plus Jakarta Sans');
    expect(tokens.typography['label-md']?.fontFamily).toBe('Inter');
  });

  it('extracts rounded tokens', () => {
    const tokens = parseTokensFromContent(VALID_DESIGN_MD);
    expect(String(tokens.rounded['sm'])).toBe('0.125rem');
    expect(String(tokens.rounded['full'])).toBe('9999px');
  });

  it('extracts spacing tokens', () => {
    const tokens = parseTokensFromContent(VALID_DESIGN_MD);
    expect(tokens.spacing['xs']).toBe('4px');
    expect(tokens.spacing['md']).toBe('16px');
  });

  it('YAML wins over text section — text section hex values are not in tokens', () => {
    const tokens = parseTokensFromContent(VALID_DESIGN_MD, 'test.md');
    const colorValues = Object.values(tokens.colors);
    // These appear only in the text section, not the YAML frontmatter
    expect(colorValues).not.toContain('#D4AF37');
    expect(colorValues).not.toContain('#C5A028');
  });

  it('primary color comes from YAML, not from text-section editorial hint', () => {
    const tokens = parseTokensFromContent(VALID_DESIGN_MD, 'test.md');
    // YAML says #f2ca50; text says #D4AF37 — YAML must win
    expect(tokens.colors['primary']).toBe('#f2ca50');
  });

  it('throws on missing opening ---', () => {
    const bad = `name: Test\ncolors:\n  surface: '#1a1a1a'\n---`;
    expect(() => parseTokensFromContent(bad, 'bad.md')).toThrow(
      /YAML frontmatter parse failed at L1/
    );
  });

  it('throws on missing closing ---', () => {
    const bad = `---\nname: Test\ncolors:\n  surface: '#1a1a1a'`;
    expect(() => parseTokensFromContent(bad, 'bad.md')).toThrow(
      /YAML frontmatter parse failed at L/
    );
  });

  it('throws on corrupt YAML with line number in message', () => {
    const corrupt = `---\nname: Test\ncolors:\n  bad: [unclosed bracket\n---`;
    expect(() => parseTokensFromContent(corrupt, 'bad.md')).toThrow(
      /YAML frontmatter parse failed at L\d+/
    );
  });

  it('returns empty objects for missing optional sections', () => {
    const minimal = `---\nname: Minimal\n---`;
    const tokens = parseTokensFromContent(minimal);
    expect(tokens.colors).toEqual({});
    expect(tokens.typography).toEqual({});
    expect(tokens.rounded).toEqual({});
    expect(tokens.spacing).toEqual({});
  });
});
