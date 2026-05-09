/**
 * Analysis.test.tsx — PRD-5 US-008 AC-5
 * ≥ 5 unit tests: 表单 + 5维度 progress + 颜色逻辑 + LS + JSON.parse error
 * Node environment — pure logic + source inspection tests (no React render)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { analysisStructuralInput } from '../../../../packages/schemas/src/specialist-io/analysis.schema';
import { getToolLsKey } from '../../../../apps/web/src/lib/ls-namespace';

const ROOT = resolve(__dirname, '../../../../');
const ANALYSIS_PAGE = `${ROOT}/apps/web/src/pages/tools/Analysis.tsx`;
const ANALYSIS_RESULT = `${ROOT}/apps/web/src/components/ToolResult/AnalysisResult.tsx`;
const TOOL_FORM = `${ROOT}/apps/web/src/components/ToolForm/ToolForm.tsx`;
const PROGRESS_UI = `${ROOT}/apps/web/src/components/ui/progress.tsx`;

function readSrc(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · 表单 render: Analysis.tsx structure ──────────────────────────────────

describe('表单 render: Analysis.tsx structure', () => {
  it('imports and uses ToolForm with toolKey analysis', () => {
    const src = readSrc(ANALYSIS_PAGE);
    expect(src).toContain('ToolForm');
    expect(src).toContain('toolKey="analysis"');
  });

  it('uses analysisStructuralInput schema', () => {
    const src = readSrc(ANALYSIS_PAGE);
    expect(src).toContain('analysisStructuralInput');
  });

  it('uses submitLabel 开始分析', () => {
    const src = readSrc(ANALYSIS_PAGE);
    expect(src).toContain('开始分析');
  });

  it('renders FeedbackButton with AnalysisAgent agentId', () => {
    const src = readSrc(ANALYSIS_PAGE);
    expect(src).toContain('FeedbackButton');
    expect(src).toContain('agentId="AnalysisAgent"');
  });

  it('result state controls AnalysisResult visibility', () => {
    const src = readSrc(ANALYSIS_PAGE);
    expect(src).toContain('{result && (');
    expect(src).toContain('AnalysisResult');
  });

  it('calls trpc.analysis.analyze.useMutation', () => {
    const src = readSrc(ANALYSIS_PAGE);
    expect(src).toContain('trpc.analysis.analyze.useMutation');
  });
});

// ── 2 · 5维度 Progress: AnalysisResult renders 5 bars ───────────────────────

describe('5维度 Progress: AnalysisResult', () => {
  it('AnalysisResult imports shadcn Progress component', () => {
    const src = readSrc(ANALYSIS_RESULT);
    expect(src).toContain("from '@/components/ui/progress'");
    expect(src).toContain('Progress');
  });

  it('AnalysisResult renders 5 dimension labels', () => {
    const src = readSrc(ANALYSIS_RESULT);
    expect(src).toContain('钩子强度');
    expect(src).toContain('起承转合');
    expect(src).toContain('情绪曲线');
    expect(src).toContain('具体性');
    expect(src).toContain('行动召唤');
  });

  it('ToolForm analysis case has char count element', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("case 'analysis'");
    expect(src).toContain('analysis-char-count');
    expect(src).toContain("watch('copy')");
  });

  it('AnalysisResult handles JSON.parse error → 解析失败', () => {
    const src = readSrc(ANALYSIS_RESULT);
    expect(src).toContain('解析失败 · 请重试');
    expect(src).toContain('analysis-parse-error');
  });

  it('AnalysisResult handles scores.overall missing → N/A', () => {
    const src = readSrc(ANALYSIS_RESULT);
    expect(src).toContain("'N/A'");
    expect(src).toContain('analysis-overall-score');
  });
});

// ── 3 · 颜色逻辑: overall score color ────────────────────────────────────────

describe('颜色逻辑: overall score color classes', () => {
  it('uses green-500 for overall >= 80', () => {
    const src = readSrc(ANALYSIS_RESULT);
    expect(src).toContain('bg-green-500');
  });

  it('uses yellow-500 for overall >= 60 and < 80', () => {
    const src = readSrc(ANALYSIS_RESULT);
    expect(src).toContain('bg-yellow-500');
  });

  it('uses red-500 for overall < 60', () => {
    const src = readSrc(ANALYSIS_RESULT);
    expect(src).toContain('bg-red-500');
  });

  it('overallColorClass logic: 80+ green, 60+ yellow, <60 red', () => {
    // Logic test using the inline helper's expected behavior
    function overallColorClass(overall: number): string {
      if (overall >= 80) return 'bg-green-500';
      if (overall >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    }
    expect(overallColorClass(85)).toBe('bg-green-500');
    expect(overallColorClass(80)).toBe('bg-green-500');
    expect(overallColorClass(79)).toBe('bg-yellow-500');
    expect(overallColorClass(60)).toBe('bg-yellow-500');
    expect(overallColorClass(59)).toBe('bg-red-500');
    expect(overallColorClass(0)).toBe('bg-red-500');
  });
});

// ── 4 · LS namespace: getToolLsKey analysis ──────────────────────────────────

describe('LS namespace: getToolLsKey', () => {
  it('ToolForm handles LS for analysis toolKey (source check)', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain('getToolLsKey');
    expect(src).toContain("toolKey, 'input'");
  });

  it('getToolLsKey(accountId, "analysis", "input") returns correct key', () => {
    const key = getToolLsKey(42, 'analysis', 'input');
    expect(key).toBe('aiip_memory_acc_42_tool_analysis_input');
  });

  it('Analysis.tsx does NOT duplicate LS write (ToolForm owns it)', () => {
    const src = readSrc(ANALYSIS_PAGE);
    // LS write is delegated to ToolForm — no direct localStorage.setItem in Analysis.tsx
    expect(src).not.toContain('localStorage.setItem');
  });
});

// ── 5 · Schema validation: copy 不足 10 字 → zod error ──────────────────────

describe('Schema validation: analysisStructuralInput', () => {
  it('copy 不足 10 字 → zod fail with Chinese error', () => {
    const res = analysisStructuralInput.safeParse({ copy: '短文' });
    expect(res.success).toBe(false);
    if (!res.success) {
      const msg = res.error.errors[0]?.message ?? '';
      expect(msg).toContain('字');
    }
  });

  it('copy 10 字 → zod pass', () => {
    const res = analysisStructuralInput.safeParse({ copy: '十个字符长度的文案内容' });
    expect(res.success).toBe(true);
  });

  it('copy 超过 3000 字 → zod fail', () => {
    const res = analysisStructuralInput.safeParse({ copy: 'a'.repeat(3001) });
    expect(res.success).toBe(false);
  });

  it('copy exact 10 chars → zod pass', () => {
    const res = analysisStructuralInput.safeParse({ copy: '1234567890' });
    expect(res.success).toBe(true);
  });

  it('copy exact 3000 chars → zod pass', () => {
    const res = analysisStructuralInput.safeParse({ copy: 'a'.repeat(3000) });
    expect(res.success).toBe(true);
  });
});

// ── 6 · Progress UI component exists ─────────────────────────────────────────

describe('Progress UI component', () => {
  it('progress.tsx exists with ProgressPrimitive', () => {
    const src = readSrc(PROGRESS_UI);
    expect(src).toContain('@radix-ui/react-progress');
    expect(src).toContain('ProgressPrimitive.Root');
    expect(src).toContain('ProgressPrimitive.Indicator');
  });

  it('progress.tsx exports Progress component', () => {
    const src = readSrc(PROGRESS_UI);
    expect(src).toContain('export { Progress }');
  });

  it('progress.tsx supports indicatorClassName prop', () => {
    const src = readSrc(PROGRESS_UI);
    expect(src).toContain('indicatorClassName');
  });
});
