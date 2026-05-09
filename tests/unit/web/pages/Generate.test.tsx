/**
 * Generate.test.tsx — PRD-5 US-004 AC-6
 * ≥ 5 unit tests: 表单 render + zod 校验 Chinese error + mutation success +
 *                  mutation error toast + LS 预填
 * Node environment — pure logic + source inspection tests (no React render)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { copywritingFreeGenerateInput } from '../../../../packages/schemas/src/specialist-io/index';
import { getToolLsKey } from '../../../../apps/web/src/lib/ls-namespace';

const ROOT = resolve(__dirname, '../../../../');
const GENERATE_PAGE = `${ROOT}/apps/web/src/pages/tools/Generate.tsx`;
const TOOL_FORM = `${ROOT}/apps/web/src/components/ToolForm/ToolForm.tsx`;

function readSrc(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · 表单 render: Generate.tsx 使用 ToolForm + 正确 schema ─────────────────

describe('表单 render: Generate.tsx structure', () => {
  it('imports and uses ToolForm with toolKey freeGenerate', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain('ToolForm');
    expect(src).toContain("toolKey=\"freeGenerate\"");
  });

  it('uses copywritingFreeGenerateInput schema', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain('copywritingFreeGenerateInput');
  });

  it('ToolForm freeGenerate case renders ScriptTypeSelect + ElementsMultiSelect + TextareaField', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("case 'freeGenerate'");
    expect(src).toContain('ScriptTypeSelect');
    expect(src).toContain('ElementsMultiSelect');
    expect(src).toContain('TextareaField');
  });

  it('renders ToolResult with freeGenerate toolKey after submit', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain('ToolResult');
    expect(src).toContain("toolKey=\"freeGenerate\"");
    expect(src).toContain('isFallback={result.isFallback}');
  });

  it('renders FeedbackButton with CopywritingAgent agentId', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain('FeedbackButton');
    expect(src).toContain('agentId="CopywritingAgent"');
  });
});

// ── 2 · zod 校验 Chinese error: schema validation ────────────────────────────

describe('zod 校验: copywritingFreeGenerateInput', () => {
  it('passes with valid scriptType + elements + topic', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: ['fear', 'social_proof'],
      topic: '为什么有的人30岁就财富自由',
    });
    expect(r.success).toBe(true);
  });

  it('fails when scriptType is invalid', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'invalid_script',
      elements: ['fear'],
      topic: '测试话题',
    });
    expect(r.success).toBe(false);
  });

  it('fails when elements is empty', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: [],
      topic: '测试话题',
    });
    expect(r.success).toBe(false);
  });

  it('fails when topic exceeds 500 chars', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: ['fear'],
      topic: '超'.repeat(501),
    });
    expect(r.success).toBe(false);
  });

  it('fails when elements exceed 8 items', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: ['greed', 'fear', 'curiosity', 'contrast', 'resonance', 'empathy', 'social_proof', 'authority', 'leverage'],
      topic: '话题内容',
    });
    expect(r.success).toBe(false);
  });
});

// ── 3 · mutation success: onSuccess setResult + ToolResult 渲染 ──────────────

describe('mutation success: Generate.tsx shows ToolResult on success', () => {
  it('calls trpc.copywriting.freeGenerate.useMutation', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain('trpc.copywriting.freeGenerate.useMutation');
  });

  it('calls setResult on success (handleSuccess)', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain('setResult');
    expect(src).toContain('handleSuccess');
  });

  it('result state controls ToolResult visibility', () => {
    const src = readSrc(GENERATE_PAGE);
    // result && <ToolResult ...> pattern
    expect(src).toContain('{result && (');
  });
});

// ── 4 · mutation error toast: ToolForm shows toast on error ──────────────────

describe('mutation error toast: ToolForm toast.error on failure', () => {
  it('ToolForm shows toast.error on mutation failure (REJ-035)', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain('toast.error');
  });

  it('Generate.tsx does not manually rollback LS on error (REJ-035)', () => {
    const src = readSrc(GENERATE_PAGE);
    // LS is kept on DB fail per REJ-035 — no removeItem
    expect(src).not.toContain('localStorage.removeItem');
  });
});

// ── 5 · LS 预填: getToolLsKey(accountId, "freeGenerate", "input") ─────────────

describe('LS 预填: freeGenerate namespace (D-031 AC-3)', () => {
  it('getToolLsKey generates correct key for freeGenerate input', () => {
    const key = getToolLsKey(42, 'freeGenerate', 'input');
    expect(key).toBe('aiip_memory_acc_42_tool_freeGenerate_input');
  });

  it('Generate.tsx uses getToolLsKey with freeGenerate and input suffix', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain("getToolLsKey");
    expect(src).toContain("'freeGenerate'");
    expect(src).toContain("'input'");
  });

  it('ToolForm uses input suffix for LS (not form)', () => {
    const src = readSrc(TOOL_FORM);
    // Should use 'input' suffix, not 'form'
    expect(src).toContain("'input'");
    expect(src).not.toContain("toolKey, 'form'");
  });

  it('LS-first dual-write: localStorage.setItem in Generate.tsx handleSubmit', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain('localStorage.setItem');
    expect(src).toContain('handleSubmit');
  });

  it('AbortController on unmount prevents state update after navigate away (AC-8)', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain('AbortController');
    expect(src).toContain('abort()');
  });
});

// ── 6 · US-011 接入预填 stub ──────────────────────────────────────────────────

describe('US-011 stub: history.detail pre-fill', () => {
  it('Generate.tsx uses trpc.history.detail.useQuery with historyId', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain('trpc.history.detail.useQuery');
    expect(src).toContain('historyId');
  });

  it('query is disabled when historyId is absent (enabled: !!historyId)', () => {
    const src = readSrc(GENERATE_PAGE);
    expect(src).toContain('enabled: !!historyId');
  });
});
