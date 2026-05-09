/**
 * BoomGenerate.test.tsx — PRD-5 US-006 AC-6
 * ≥ 5 unit tests: 表单 + 5篇 split + copy button + LS 预填 + schema validation
 * Node environment — pure logic + source inspection tests (no React render)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { generateBoomInput } from '../../../../packages/schemas/src/specialist-io/index';
import { getToolLsKey } from '../../../../apps/web/src/lib/ls-namespace';

const ROOT = resolve(__dirname, '../../../../');
const BOOM_PAGE = `${ROOT}/apps/web/src/pages/tools/BoomGenerate.tsx`;
const BOOM_RESULT = `${ROOT}/apps/web/src/components/ToolResult/BoomGenerateResult.tsx`;
const TOOL_FORM = `${ROOT}/apps/web/src/components/ToolForm/ToolForm.tsx`;

function readSrc(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · 表单 render: BoomGenerate.tsx structure ───────────────────────────────

describe('表单 render: BoomGenerate.tsx structure', () => {
  it('imports and uses ToolForm with toolKey boom-generate', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('ToolForm');
    expect(src).toContain('toolKey="boom-generate"');
  });

  it('uses generateBoomInput schema', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('generateBoomInput');
  });

  it('uses submitLabel 一键生成爆款文案', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('一键生成爆款文案');
  });

  it('ToolForm boom-generate case renders ElementsMultiSelect + industry + theme', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("case 'boom-generate'");
    expect(src).toContain('ElementsMultiSelect');
    expect(src).toContain('tool-boom-industry');
    expect(src).toContain('tool-boom-theme');
  });

  it('renders FeedbackButton with CopywritingAgent agentId', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('FeedbackButton');
    expect(src).toContain('agentId="CopywritingAgent"');
  });

  it('result state controls BoomGenerateResult visibility', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('{result && (');
    expect(src).toContain('BoomGenerateResult');
  });
});

// ── 2 · 5篇 split: BoomGenerateResult splits content by --- ──────────────────

describe('5篇 split: BoomGenerateResult', () => {
  it('BoomGenerateResult.tsx splits content by /\\n*---\\n*/', () => {
    const src = readSrc(BOOM_RESULT);
    expect(src).toContain("split(/\\n*---\\n*/)");
  });

  it('renders grid md:grid-cols-2 for 5 candidates', () => {
    const src = readSrc(BOOM_RESULT);
    expect(src).toContain('grid md:grid-cols-2');
  });

  it('shows 输出格式异常 when candidates.length !== 5', () => {
    const src = readSrc(BOOM_RESULT);
    expect(src).toContain('输出格式异常');
  });

  it('renders react-markdown for each candidate', () => {
    const src = readSrc(BOOM_RESULT);
    expect(src).toContain('ReactMarkdown');
    expect(src).toContain('remarkGfm');
  });

  it('split of 5-candidate content produces 5 items', () => {
    const content = [
      '## 第一篇内容',
      '## 第二篇内容',
      '## 第三篇内容',
      '## 第四篇内容',
      '## 第五篇内容',
    ].join('\n\n---\n\n');

    const candidates = content.split(/\n*---\n*/);
    expect(candidates).toHaveLength(5);
  });

  it('split of malformed content (no ---) produces 1 item, not 5', () => {
    const content = '单篇内容，没有分隔符';
    const candidates = content.split(/\n*---\n*/);
    expect(candidates).toHaveLength(1);
    expect(candidates).not.toHaveLength(5);
  });
});

// ── 3 · copy button: BoomGenerateResult has copy button ──────────────────────

describe('copy button: BoomGenerateResult', () => {
  it('renders copy button for each candidate (boom-copy-N)', () => {
    const src = readSrc(BOOM_RESULT);
    expect(src).toContain('boom-copy-');
  });

  it('calls navigator.clipboard.writeText on copy', () => {
    const src = readSrc(BOOM_RESULT);
    expect(src).toContain('navigator.clipboard.writeText');
  });

  it('shows toast.success on successful copy', () => {
    const src = readSrc(BOOM_RESULT);
    expect(src).toContain("toast.success('已复制')");
  });

  it('shows toast.error on clipboard failure (AC-9)', () => {
    const src = readSrc(BOOM_RESULT);
    expect(src).toContain("toast.error('复制失败 · 请手动')");
  });
});

// ── 4 · LS 预填: getToolLsKey(accountId, "boomGenerate", "input") ─────────────

describe('LS 预填: boomGenerate namespace (D-031 AC-4)', () => {
  it('getToolLsKey generates correct key for boomGenerate input', () => {
    const key = getToolLsKey(42, 'boomGenerate', 'input');
    expect(key).toBe('aiip_memory_acc_42_tool_boomGenerate_input');
  });

  it('BoomGenerate.tsx uses getToolLsKey with boomGenerate and input suffix', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('getToolLsKey');
    expect(src).toContain("'boomGenerate'");
    expect(src).toContain("'input'");
  });

  it('BoomGenerate.tsx calls localStorage.setItem in handleSubmit (LS-first dual-write)', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('localStorage.setItem');
    expect(src).toContain('handleSubmit');
  });

  it('AbortController on unmount prevents state update after navigate away', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('AbortController');
    expect(src).toContain('abort()');
  });

  it('BoomGenerate.tsx reads industry default from useActiveAccount (AC-5)', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('useActiveAccount');
    expect(src).toContain('industryDefault');
    expect(src).toContain('industry');
  });
});

// ── 5 · schema validation: generateBoomInput ─────────────────────────────────

describe('zod 校验: generateBoomInput', () => {
  it('passes with valid elements', () => {
    const r = generateBoomInput.safeParse({
      elements: ['fear', 'scarcity'],
    });
    expect(r.success).toBe(true);
  });

  it('fails when elements is empty', () => {
    const r = generateBoomInput.safeParse({ elements: [] });
    expect(r.success).toBe(false);
  });

  it('fails when elements exceed 8 items', () => {
    const r = generateBoomInput.safeParse({
      elements: ['greed', 'fear', 'curiosity', 'contrast', 'resonance', 'empathy', 'social_proof', 'authority', 'leverage'],
    });
    expect(r.success).toBe(false);
  });

  it('passes with optional industry and theme', () => {
    const r = generateBoomInput.safeParse({
      elements: ['fear'],
      industry: '健康养生',
      theme: '减肥',
    });
    expect(r.success).toBe(true);
  });

  it('fails with invalid element key', () => {
    const r = generateBoomInput.safeParse({
      elements: ['invalid_element'],
    });
    expect(r.success).toBe(false);
  });
});

// ── 6 · mutation: BoomGenerate.tsx uses trpc.boomGenerate.generate ────────────

describe('mutation: boomGenerate.generate', () => {
  it('BoomGenerate.tsx calls trpc.boomGenerate.generate.useMutation', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('trpc.boomGenerate.generate.useMutation');
  });

  it('BoomGenerate.tsx calls setResult on handleSuccess', () => {
    const src = readSrc(BOOM_PAGE);
    expect(src).toContain('setResult');
    expect(src).toContain('handleSuccess');
  });
});
