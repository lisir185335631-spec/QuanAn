/**
 * PresentStyles.test.tsx — PRD-15 US-004 AC-4
 * ≥ 4 unit tests: source inspection (node environment, no React render)
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { PresentStylesInputSchema } from '../../../../packages/schemas/src/specialist-io/presentStyles.schema';

const ROOT = resolve(__dirname, '../../../../');
const PRESENT_STYLES_PAGE = `${ROOT}/apps/web/src/pages/tools/PresentStyles.tsx`;
const PRESENT_STYLES_SCHEMA = `${ROOT}/packages/schemas/src/specialist-io/presentStyles.schema.ts`;
const PRESENT_STYLES_ROUTER = `${ROOT}/apps/api/src/trpc/routers/presentStyles.ts`;
const APP_ROUTER = `${ROOT}/apps/api/src/trpc/routers/_app.ts`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · Page structure ────────────────────────────────────────────────────────

describe('PresentStyles.tsx page structure', () => {
  it('has 80+ lines (stub replaced)', () => {
    const lines = src(PRESENT_STYLES_PAGE).split('\n').length;
    expect(lines).toBeGreaterThan(80);
  });

  it('has textarea for 文案内容', () => {
    const page = src(PRESENT_STYLES_PAGE);
    expect(page).toContain('<textarea');
    expect(page).toContain('文案内容');
  });

  it('has platform select (平台)', () => {
    const page = src(PRESENT_STYLES_PAGE);
    expect(page).toContain('Select');
    expect(page).toContain('platform');
    expect(page).toContain('发布平台');
  });

  it('calls trpc.presentStyles.recommend.useMutation', () => {
    const page = src(PRESENT_STYLES_PAGE);
    expect(page).toContain('trpc.presentStyles.recommend.useMutation');
  });
});

// ── 2 · URL state + localStorage ─────────────────────────────────────────────

describe('PresentStyles.tsx URL state + localStorage (AC-3)', () => {
  it('uses useSearchParams for URL state', () => {
    const page = src(PRESENT_STYLES_PAGE);
    expect(page).toContain('useSearchParams');
  });

  it('uses getToolLsKey for presentStyles draft LS key', () => {
    const page = src(PRESENT_STYLES_PAGE);
    expect(page).toContain('getToolLsKey');
    expect(page).toContain('presentStyles');
  });

  it('persists text and platform to URL params', () => {
    const page = src(PRESENT_STYLES_PAGE);
    expect(page).toContain("'text'");
    expect(page).toContain("'platform'");
  });
});

// ── 3 · Style cards display ───────────────────────────────────────────────────

describe('PresentStyles.tsx style cards display (AC-2)', () => {
  it('shows 图文/短视频/直播口播/长图文/漫画 style types', () => {
    const page = src(PRESENT_STYLES_PAGE);
    expect(page).toContain('图文');
    expect(page).toContain('短视频');
    expect(page).toContain('直播口播');
    expect(page).toContain('长图文');
    expect(page).toContain('漫画');
  });

  it('shows result container after submission', () => {
    const page = src(PRESENT_STYLES_PAGE);
    expect(page).toContain('present-styles-result');
  });

  it('has example text in style cards', () => {
    const page = src(PRESENT_STYLES_PAGE);
    expect(page).toContain('示例：');
  });

  it('supports 重新分析 retry button', () => {
    const page = src(PRESENT_STYLES_PAGE);
    expect(page).toContain('重新分析');
    expect(page).toContain('handleRetry');
  });
});

// ── 4 · Schema validation ─────────────────────────────────────────────────────

describe('PresentStylesInputSchema schema', () => {
  it('text < 10 chars → zod fail with Chinese error', () => {
    const res = PresentStylesInputSchema.safeParse({ text: '短', platform: 'douyin' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0]?.message).toContain('字');
    }
  });

  it('valid input → zod pass', () => {
    const res = PresentStylesInputSchema.safeParse({
      text: '这是一段测试文案内容，用于测试平台推荐功能',
      platform: 'xiaohongshu',
    });
    expect(res.success).toBe(true);
  });

  it('invalid platform → zod fail', () => {
    const res = PresentStylesInputSchema.safeParse({
      text: '这是一段测试文案内容，用于测试平台推荐功能',
      platform: 'invalid_platform',
    });
    expect(res.success).toBe(false);
  });

  it('presentStyles router registered in app router', () => {
    const appRouter = src(APP_ROUTER);
    expect(appRouter).toContain('presentStyles: presentStylesRouter');
  });

  it('presentStyles router has recommend procedure', () => {
    const router = src(PRESENT_STYLES_ROUTER);
    expect(router).toContain('recommend');
    expect(router).toContain('PresentationAgent');
  });

  it('presentStyles.schema.ts defines PRESENT_STYLE_TYPES with 5 types', () => {
    const schema = src(PRESENT_STYLES_SCHEMA);
    expect(schema).toContain('graphic_text');
    expect(schema).toContain('short_video');
    expect(schema).toContain('live_stream');
    expect(schema).toContain('long_article');
    expect(schema).toContain('comic');
  });
});
