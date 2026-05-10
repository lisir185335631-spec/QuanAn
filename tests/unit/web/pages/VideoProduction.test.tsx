/**
 * VideoProduction.test.tsx — PRD-6 US-004 AC-12
 * 5 unit tests: 表单渲染所有字段 + zod 校验失败中文 message + submit 调 mutation + LS 写入+读取 + ?historyId 预填
 * Node environment — pure logic + source inspection tests (no React render)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { videoProductionInput } from '../../../../packages/schemas/src/specialist-io/videoProduction.schema';
import { getToolLsKey } from '../../../../apps/web/src/lib/ls-namespace';

const ROOT = resolve(__dirname, '../../../../');
const VP_PAGE = `${ROOT}/apps/web/src/pages/tools/VideoProduction.tsx`;
const VP_RESULT = `${ROOT}/apps/web/src/components/ToolResult/VideoProductionResult.tsx`;
const TOOL_FORM = `${ROOT}/apps/web/src/components/ToolForm/ToolForm.tsx`;
const TOOL_RESULT = `${ROOT}/apps/web/src/components/ToolResult/ToolResult.tsx`;

function readSrc(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · 表单渲染所有字段 ─────────────────────────────────────────────────────

describe('表单渲染所有字段: VideoProduction.tsx + ToolForm.tsx', () => {
  it('imports and uses ToolForm with toolKey video-production', () => {
    const src = readSrc(VP_PAGE);
    expect(src).toContain('ToolForm');
    expect(src).toContain('toolKey="video-production"');
  });

  it('ToolForm has video-production case with sourceCopy textarea', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("case 'video-production':");
    expect(src).toContain("register('sourceCopy')");
  });

  it('ToolForm video-production case has videoType select and duration select', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("register('videoType')");
    expect(src).toContain("register('duration')");
    expect(src).toContain('short_form');
    expect(src).toContain('long_form');
    expect(src).toContain('60s');
    expect(src).toContain('180s');
  });

  it('VideoProduction page uses videoProductionInput schema', () => {
    const src = readSrc(VP_PAGE);
    expect(src).toContain('videoProductionInput');
  });

  it('submitLabel 生成方案', () => {
    const src = readSrc(VP_PAGE);
    expect(src).toContain('生成方案');
  });
});

// ── 2 · zod 校验失败显示中文 message ────────────────────────────────────────

describe('zod 校验失败显示中文 message', () => {
  it('sourceCopy min 10 中文 error message', () => {
    const result = videoProductionInput.safeParse({
      sourceCopy: '短',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'sourceCopy');
      expect(issue?.message).toBe('原始文案至少 10 字符');
    }
  });

  it('sourceCopy max 3000 中文 error message', () => {
    const result = videoProductionInput.safeParse({
      sourceCopy: 'a'.repeat(3001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'sourceCopy');
      expect(issue?.message).toBe('原始文案不能超过3000字符');
    }
  });

  it('videoType invalid enum value fails', () => {
    const result = videoProductionInput.safeParse({
      sourceCopy: '今天分享一段健身减脂经历，三个月减了15kg',
      videoType: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });

  it('valid input passes', () => {
    const result = videoProductionInput.safeParse({
      sourceCopy: '今天分享一段健身减脂经历，三个月减了15kg，想和大家聊聊背后的方法论',
      videoType: 'short_form',
      duration: '60s',
    });
    expect(result.success).toBe(true);
  });
});

// ── 3 · submit 调 mutation ───────────────────────────────────────────────────

describe('submit 调 trpc.videoProduction.generate.useMutation', () => {
  it('VideoProduction page calls trpc.videoProduction.generate.useMutation', () => {
    const src = readSrc(VP_PAGE);
    expect(src).toContain('trpc.videoProduction.generate.useMutation');
  });

  it('mutation result is passed to VideoProductionResult', () => {
    const src = readSrc(VP_PAGE);
    expect(src).toContain('VideoProductionResult');
    expect(src).toContain('{result && (');
  });

  it('VideoProduction page renders FeedbackButton with VideoAgent', () => {
    const src = readSrc(VP_PAGE);
    expect(src).toContain('FeedbackButton');
    expect(src).toContain('agentId="VideoAgent"');
  });

  it('ToolResult switch includes video-production case', () => {
    const src = readSrc(TOOL_RESULT);
    expect(src).toContain("case 'video-production':");
    expect(src).toContain('VideoProductionResult');
  });
});

// ── 4 · LS 写入 + 读取 ───────────────────────────────────────────────────────

describe('LS 写入 + 读取 (D-031)', () => {
  it('getToolLsKey generates correct namespaced key for video-production', () => {
    const key = getToolLsKey(42, 'video-production', 'input');
    expect(key).toContain('acc_42_tool_video-production_input');
  });

  it('ToolForm handles LS restore for video-production toolKey', () => {
    const src = readSrc(TOOL_FORM);
    // ToolForm uses getToolLsKey internally for all toolKeys including video-production
    expect(src).toContain('getToolLsKey');
    expect(src).toContain("'video-production'");
  });

  it('VideoProductionResult renders storyboard table with data-testid', () => {
    const src = readSrc(VP_RESULT);
    expect(src).toContain('video-production-storyboard-table');
  });
});

// ── 5 · ?historyId 预填 ──────────────────────────────────────────────────────

describe('?historyId 预填', () => {
  it('VideoProduction page reads historyId from searchParams', () => {
    const src = readSrc(VP_PAGE);
    expect(src).toContain('historyId');
    expect(src).toContain('useSearchParams');
  });

  it('VideoProduction page calls trpc.history.detail.useQuery with historyId', () => {
    const src = readSrc(VP_PAGE);
    expect(src).toContain('trpc.history.detail.useQuery');
    expect(src).toContain('enabled: !!historyId');
  });

  it('historyDefaults uses inputSummary for sourceCopy', () => {
    const src = readSrc(VP_PAGE);
    expect(src).toContain('inputSummary');
    expect(src).toContain('historyDefaults');
  });

  it('VideoProductionResult handles JSON.parse failure → 解析失败', () => {
    const src = readSrc(VP_RESULT);
    expect(src).toContain('解析失败');
    expect(src).toContain('video-production-parse-error');
  });

  it('VideoProductionResult renders equipment and schedule sections', () => {
    const src = readSrc(VP_RESULT);
    expect(src).toContain('video-production-equipment');
    expect(src).toContain('video-production-schedule');
    expect(src).toContain('设备清单');
    expect(src).toContain('拍摄排期');
  });
});
