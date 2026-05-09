/**
 * VideoAnalysis.test.tsx — PRD-5 US-010 AC-6
 * ≥ 5 unit tests: 表单 + elements tag 渲染 + insights 列表 + rewriteVersion markdown + LS
 * Node environment — pure logic + source inspection tests (no React render)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { analyzeVideoInput } from '../../../../packages/schemas/src/specialist-io/videoAnalysis.schema';
import { HOT_ELEMENTS_ZH } from '../../../../apps/web/src/lib/constants/hotElementsZh';
import { getToolLsKey } from '../../../../apps/web/src/lib/ls-namespace';

const ROOT = resolve(__dirname, '../../../../');
const VA_PAGE = `${ROOT}/apps/web/src/pages/tools/VideoAnalysis.tsx`;
const VA_RESULT = `${ROOT}/apps/web/src/components/ToolResult/VideoAnalysisResult.tsx`;
const TOOL_FORM = `${ROOT}/apps/web/src/components/ToolForm/ToolForm.tsx`;

function readSrc(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · 表单 render: VideoAnalysis.tsx structure ────────────────────────────

describe('表单 render: VideoAnalysis.tsx structure', () => {
  it('imports and uses ToolForm with toolKey video-analysis', () => {
    const src = readSrc(VA_PAGE);
    expect(src).toContain('ToolForm');
    expect(src).toContain('toolKey="video-analysis"');
  });

  it('uses analyzeVideoInput schema', () => {
    const src = readSrc(VA_PAGE);
    expect(src).toContain('analyzeVideoInput');
  });

  it('calls trpc.videoAnalysis.analyze.useMutation', () => {
    const src = readSrc(VA_PAGE);
    expect(src).toContain('trpc.videoAnalysis.analyze.useMutation');
  });

  it('renders FeedbackButton with AnalysisAgent agentId', () => {
    const src = readSrc(VA_PAGE);
    expect(src).toContain('FeedbackButton');
    expect(src).toContain('agentId="AnalysisAgent"');
  });

  it('result state controls VideoAnalysisResult visibility', () => {
    const src = readSrc(VA_PAGE);
    expect(src).toContain('{result && (');
    expect(src).toContain('VideoAnalysisResult');
  });

  it('submitLabel 开始深度解析', () => {
    const src = readSrc(VA_PAGE);
    expect(src).toContain('开始深度解析');
  });
});

// ── 2 · elements tag 渲染: VideoAnalysisResult ──────────────────────────────

describe('elements tag 渲染: VideoAnalysisResult', () => {
  it('VideoAnalysisResult imports HOT_ELEMENTS_ZH for Chinese mapping', () => {
    const src = readSrc(VA_RESULT);
    expect(src).toContain('HOT_ELEMENTS_ZH');
  });

  it('VideoAnalysisResult renders elements with data-testid tags', () => {
    const src = readSrc(VA_RESULT);
    expect(src).toContain('video-analysis-elements');
    expect(src).toContain('video-analysis-tag-');
  });

  it('VideoAnalysisResult handles empty elements → 无识别元素', () => {
    const src = readSrc(VA_RESULT);
    expect(src).toContain('无识别元素');
    expect(src).toContain('video-analysis-no-elements');
  });

  it('VideoAnalysisResult handles JSON.parse failure → 解析失败', () => {
    const src = readSrc(VA_RESULT);
    expect(src).toContain('解析失败');
    expect(src).toContain('video-analysis-parse-error');
  });

  it('HOT_ELEMENTS_ZH contains 22 entries', () => {
    expect(Object.keys(HOT_ELEMENTS_ZH)).toHaveLength(22);
  });

  it('HOT_ELEMENTS_ZH has correct mappings', () => {
    expect(HOT_ELEMENTS_ZH.fear).toBe('恐惧');
    expect(HOT_ELEMENTS_ZH.scarcity).toBe('稀缺');
    expect(HOT_ELEMENTS_ZH.greed).toBe('贪念');
    expect(HOT_ELEMENTS_ZH.social_proof).toBe('社会证明');
  });
});

// ── 3 · insights 列表: Card 含 element + explanation + impact ───────────────

describe('insights 列表: VideoAnalysisResult', () => {
  it('renders insights with data-testid', () => {
    const src = readSrc(VA_RESULT);
    expect(src).toContain('video-analysis-insights');
    expect(src).toContain('video-analysis-insight-');
  });

  it('renders impact color classes 高/中/低', () => {
    const src = readSrc(VA_RESULT);
    expect(src).toContain('video-analysis-impact-');
    expect(src).toContain('高影响');
    expect(src).toContain('中影响');
    expect(src).toContain('低影响');
  });
});

// ── 4 · rewriteVersion markdown ─────────────────────────────────────────────

describe('rewriteVersion markdown: VideoAnalysisResult', () => {
  it('imports react-markdown and remark-gfm', () => {
    const src = readSrc(VA_RESULT);
    expect(src).toContain("from 'react-markdown'");
    expect(src).toContain("from 'remark-gfm'");
  });

  it('renders rewriteVersion in markdown article with data-testid', () => {
    const src = readSrc(VA_RESULT);
    expect(src).toContain('video-analysis-rewrite');
    expect(src).toContain('ReactMarkdown');
    expect(src).toContain('remarkGfm');
  });
});

// ── 5 · LS namespace ─────────────────────────────────────────────────────────

describe('LS namespace: ToolForm handles video-analysis storage', () => {
  it('ToolForm video-analysis case exists in switch', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("case 'video-analysis':");
  });

  it('ToolForm video-analysis default values include lastTitle and lastCopy', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("'video-analysis'");
    expect(src).toContain('lastTitle');
    expect(src).toContain('lastCopy');
  });

  it('getToolLsKey produces correct namespace key for video-analysis', () => {
    const key = getToolLsKey(42, 'video-analysis', 'input');
    expect(key).toBe('aiip_memory_acc_42_tool_video-analysis_input');
  });

  it('analyzeVideoInput schema validates min 10 chars for lastCopy', () => {
    const result = analyzeVideoInput.safeParse({ lastCopy: '短' });
    expect(result.success).toBe(false);

    const ok = analyzeVideoInput.safeParse({ lastCopy: '这是一段超过十个字的爆款文案内容' });
    expect(ok.success).toBe(true);
  });
});
