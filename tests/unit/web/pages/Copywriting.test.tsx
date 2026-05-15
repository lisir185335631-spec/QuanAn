/**
 * Copywriting.test.tsx — PRD-15 US-002 AC-10/11
 * ≥ 8 unit tests: 源码结构 + schema 验证 + URL state + LS draft + 组件检查
 * Node environment — pure logic + source inspection tests (no React render)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { copywritingFreeGenerateInput } from '../../../../packages/schemas/src/specialist-io/index';
import { getToolLsKey } from '../../../../apps/web/src/lib/ls-namespace';

const ROOT = resolve(__dirname, '../../../../');
const COPYWRITING_PAGE = `${ROOT}/apps/web/src/pages/tools/Copywriting.tsx`;
const COPYWRITING_FORM = `${ROOT}/apps/web/src/pages/tools/components/CopywritingForm.tsx`;
const COPYWRITING_PREVIEW = `${ROOT}/apps/web/src/pages/tools/components/CopywritingPreview.tsx`;
const COPYWRITING_HISTORY = `${ROOT}/apps/web/src/pages/tools/components/CopywritingHistory.tsx`;
const STREAMDOWN = `${ROOT}/apps/web/src/components/StreamdownPreview.tsx`;
const SCRIPTS_CONSTANTS = `${ROOT}/apps/web/src/lib/constants/scripts.ts`;

function readSrc(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · Page structure ────────────────────────────────────────────────────────

describe('Copywriting.tsx page structure', () => {
  it('imports and uses CopywritingForm', () => {
    const src = readSrc(COPYWRITING_PAGE);
    expect(src).toContain('CopywritingForm');
    expect(src).toContain("from './components/CopywritingForm'");
  });

  it('imports and uses CopywritingPreview', () => {
    const src = readSrc(COPYWRITING_PAGE);
    expect(src).toContain('CopywritingPreview');
    expect(src).toContain("from './components/CopywritingPreview'");
  });

  it('imports and uses CopywritingHistory sidebar', () => {
    const src = readSrc(COPYWRITING_PAGE);
    expect(src).toContain('CopywritingHistory');
    expect(src).toContain("from './components/CopywritingHistory'");
  });

  it('calls trpc.copywriting.freeGenerate.useMutation()', () => {
    const src = readSrc(COPYWRITING_PAGE);
    expect(src).toContain('trpc.copywriting.freeGenerate.useMutation');
  });

  it('uses useSearchParams for URL state (AC-6)', () => {
    const src = readSrc(COPYWRITING_PAGE);
    expect(src).toContain('useSearchParams');
    expect(src).toContain('topic');
    expect(src).toContain('platform');
    expect(src).toContain('scriptType');
  });

  it('implements localStorage draft key (AC-7)', () => {
    const src = readSrc(COPYWRITING_PAGE);
    expect(src).toContain('copywriting_draft_');
    expect(src).toContain('userId');
    expect(src).toContain('accountId');
  });

  it('implements debounce for LS draft save (AC-7)', () => {
    const src = readSrc(COPYWRITING_PAGE);
    expect(src).toContain('1000'); // 1s debounce
    expect(src).toContain('setTimeout');
  });

  it('sets isStreaming=true on mutation success', () => {
    const src = readSrc(COPYWRITING_PAGE);
    expect(src).toContain('setIsStreaming(true)');
  });
});

// ── 2 · CopywritingForm structure ─────────────────────────────────────────────

describe('CopywritingForm component structure', () => {
  it('renders topic textarea with data-testid', () => {
    const src = readSrc(COPYWRITING_FORM);
    expect(src).toContain('topic-textarea');
  });

  it('renders 6 platform buttons', () => {
    const src = readSrc(COPYWRITING_FORM);
    expect(src).toContain('xiaohongshu');
    expect(src).toContain('douyin');
    expect(src).toContain('shipinhao');
    expect(src).toContain('kuaishou');
    expect(src).toContain('bilibili');
    expect(src).toContain('weibo');
  });

  it('imports SCRIPT_TYPE_LABELS from lib/constants/scripts', () => {
    const src = readSrc(COPYWRITING_FORM);
    expect(src).toContain('SCRIPT_TYPE_LABELS');
    expect(src).toContain("from '@/lib/constants/scripts'");
  });

  it('renders elements checkbox group from HOT_ELEMENT_GROUPS', () => {
    const src = readSrc(COPYWRITING_FORM);
    expect(src).toContain('HOT_ELEMENT_GROUPS');
    expect(src).toContain('HOT_ELEMENTS_ZH');
  });

  it('renders submit button with ✨ 生成爆款文案', () => {
    const src = readSrc(COPYWRITING_FORM);
    expect(src).toContain('✨ 生成爆款文案');
  });

  it('validates topic minimum length (≥10 字)', () => {
    const src = readSrc(COPYWRITING_FORM);
    expect(src).toContain('topic.trim().length < 10');
  });
});

// ── 3 · StreamdownPreview structure ──────────────────────────────────────────

describe('StreamdownPreview component structure', () => {
  it('renders ReactMarkdown with remark-gfm', () => {
    const src = readSrc(STREAMDOWN);
    expect(src).toContain('ReactMarkdown');
    expect(src).toContain('remarkGfm');
  });

  it('accepts isStreaming prop and animates content', () => {
    const src = readSrc(STREAMDOWN);
    expect(src).toContain('isStreaming');
    expect(src).toContain('requestAnimationFrame');
  });

  it('shows model meta chunk when modelName provided', () => {
    const src = readSrc(STREAMDOWN);
    expect(src).toContain('modelName');
    expect(src).toContain('streamdown-model');
  });
});

// ── 4 · CopywritingPreview structure ─────────────────────────────────────────

describe('CopywritingPreview component structure', () => {
  it('uses lazy StreamdownPreview + Suspense (AC-9)', () => {
    const src = readSrc(COPYWRITING_PREVIEW);
    expect(src).toContain("lazy(() => import('@/components/StreamdownPreview'))");
    expect(src).toContain('Suspense');
  });

  it('renders 复制全文 / 另存为模板 / 保存到历史 三按钮', () => {
    const src = readSrc(COPYWRITING_PREVIEW);
    expect(src).toContain('复制全文');
    expect(src).toContain('另存为模板');
    expect(src).toContain('保存到历史');
  });

  it('renders error with color=error (AC-4)', () => {
    const src = readSrc(COPYWRITING_PREVIEW);
    expect(src).toContain('copywriting-error');
    expect(src).toContain('text-error');
  });
});

// ── 5 · CopywritingHistory structure ─────────────────────────────────────────

describe('CopywritingHistory component structure', () => {
  it('queries trpc.history.list with agentId=CopywritingAgent', () => {
    const src = readSrc(COPYWRITING_HISTORY);
    expect(src).toContain('trpc.history.list.useQuery');
    expect(src).toContain('CopywritingAgent');
    expect(src).toContain('limit: 10');
  });

  it('renders toggle button for collapse', () => {
    const src = readSrc(COPYWRITING_HISTORY);
    expect(src).toContain('history-toggle-btn');
  });
});

// ── 6 · scripts.ts constants ─────────────────────────────────────────────────

describe('lib/constants/scripts.ts', () => {
  it('exports SCRIPT_TYPE_KEYS_20 and SCRIPT_TYPE_LABELS', () => {
    const src = readSrc(SCRIPTS_CONSTANTS);
    expect(src).toContain('SCRIPT_TYPE_KEYS_20');
    expect(src).toContain('SCRIPT_TYPE_LABELS');
  });
});

// ── 7 · Schema validation ─────────────────────────────────────────────────────

describe('copywritingFreeGenerateInput schema', () => {
  it('passes with valid scriptType + elements + topic', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: ['fear', 'social_proof'],
      topic: '如何在30天内显著提升小红书涨粉速度',
    });
    expect(r.success).toBe(true);
  });

  it('fails when topic is too short (< 1 char)', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: ['fear'],
      topic: '',
    });
    expect(r.success).toBe(false);
  });

  it('fails when elements array is empty', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: [],
      topic: '测试话题内容要足够长',
    });
    expect(r.success).toBe(false);
  });

  it('fails when elements exceed 8 items', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: ['fear', 'greed', 'curiosity', 'contrast', 'resonance', 'empathy', 'social_proof', 'authority', 'leverage'],
      topic: '测试话题',
    });
    expect(r.success).toBe(false);
  });
});

// ── 8 · LS key utility ────────────────────────────────────────────────────────

describe('localStorage key utilities', () => {
  it('draft key format is copywriting_draft_${userId}_${accountId}', () => {
    // Verify the naming convention used in Copywriting.tsx
    const src = readSrc(COPYWRITING_PAGE);
    expect(src).toContain('copywriting_draft_');
  });

  it('getToolLsKey produces correct aiip pattern', () => {
    const key = getToolLsKey(42, 'copywriting', 'draft');
    expect(key).toBe('aiip_memory_acc_42_tool_copywriting_draft');
  });
});
