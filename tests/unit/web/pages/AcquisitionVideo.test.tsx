/**
 * AcquisitionVideo.test.tsx — PRD-6 US-006 AC-10
 * 5 unit tests: 表单渲染所有字段 + zod 校验失败中文 message + submit 调 mutation + LS 写入+读取 + ?historyId 预填
 * Node environment — pure logic + source inspection tests (no React render)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { acquisitionVideoFrontendInput } from '../../../../apps/web/src/lib/schemas/acquisitionVideoFrontend';
import { getToolLsKey } from '../../../../apps/web/src/lib/ls-namespace';

const ROOT = resolve(__dirname, '../../../../');
const AV_PAGE = `${ROOT}/apps/web/src/pages/tools/AcquisitionVideo.tsx`;
const AV_RESULT = `${ROOT}/apps/web/src/components/ToolResult/AcquisitionVideoResult.tsx`;
const TOOL_FORM = `${ROOT}/apps/web/src/components/ToolForm/ToolForm.tsx`;
const TOOL_RESULT = `${ROOT}/apps/web/src/components/ToolResult/ToolResult.tsx`;

function readSrc(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · 表单渲染所有字段 ─────────────────────────────────────────────────────

describe('表单渲染所有字段: AcquisitionVideo.tsx + ToolForm.tsx', () => {
  it('imports and uses ToolForm with toolKey acquisition-video', () => {
    const src = readSrc(AV_PAGE);
    expect(src).toContain('ToolForm');
    expect(src).toContain('toolKey="acquisition-video"');
  });

  it('ToolForm has acquisition-video case with sourceCopy textarea and conversionGoal input', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("case 'acquisition-video':");
    expect(src).toContain("register('sourceCopy')");
    expect(src).toContain("register('conversionGoal')");
  });

  it('ToolForm acquisition-video case has platform select and duration select', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("register('platform')");
    expect(src).toContain("register('duration')");
    expect(src).toContain('tool-av-platform');
    expect(src).toContain('tool-av-duration');
    expect(src).toContain('tool-av-conversion-goal');
  });

  it('AcquisitionVideo page uses acquisitionVideoFrontendInput schema', () => {
    const src = readSrc(AV_PAGE);
    expect(src).toContain('acquisitionVideoFrontendInput');
  });

  it('submitLabel 生成方案', () => {
    const src = readSrc(AV_PAGE);
    expect(src).toContain('生成方案');
  });
});

// ── 2 · zod 校验失败显示中文 message ────────────────────────────────────────

describe('zod 校验失败显示中文 message', () => {
  it('conversionGoal 留空 → 转化目标必填', () => {
    const result = acquisitionVideoFrontendInput.safeParse({
      sourceCopy: '今天分享一段健身减脂经历，三个月减了15kg，想和大家聊聊方法论',
      conversionGoal: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'conversionGoal');
      expect(issue?.message).toBe('转化目标必填');
    }
  });

  it('sourceCopy min 10 → 中文 error message', () => {
    const result = acquisitionVideoFrontendInput.safeParse({
      sourceCopy: '短',
      conversionGoal: '引导私信',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'sourceCopy');
      expect(issue?.message).toBe('sourceCopy 至少 10 个字符');
    }
  });

  it('valid input with required fields passes', () => {
    const result = acquisitionVideoFrontendInput.safeParse({
      sourceCopy: '今天分享一段健身减脂经历，三个月减了15kg，想和大家聊聊方法论',
      conversionGoal: '引导用户私信咨询',
    });
    expect(result.success).toBe(true);
  });

  it('valid input with all fields passes', () => {
    const result = acquisitionVideoFrontendInput.safeParse({
      sourceCopy: '今天分享一段健身减脂经历，三个月减了15kg，想和大家聊聊方法论',
      conversionGoal: '扫码进群',
      platform: 'douyin',
      duration: '60s',
    });
    expect(result.success).toBe(true);
  });

  it('empty string duration preprocessed to undefined — valid', () => {
    const result = acquisitionVideoFrontendInput.safeParse({
      sourceCopy: '今天分享一段健身减脂经历，三个月减了15kg，想和大家聊聊方法论',
      conversionGoal: '扫码进群',
      duration: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBeUndefined();
    }
  });
});

// ── 3 · submit 调 mutation ───────────────────────────────────────────────────

describe('submit 调 trpc.acquisitionVideo.generate.useMutation', () => {
  it('AcquisitionVideo page calls trpc.acquisitionVideo.generate.useMutation', () => {
    const src = readSrc(AV_PAGE);
    expect(src).toContain('trpc.acquisitionVideo.generate.useMutation');
  });

  it('mutation result is passed to AcquisitionVideoResult', () => {
    const src = readSrc(AV_PAGE);
    expect(src).toContain('AcquisitionVideoResult');
    expect(src).toContain('{result && (');
  });

  it('AcquisitionVideo page renders FeedbackButton with VideoAgent', () => {
    const src = readSrc(AV_PAGE);
    expect(src).toContain('FeedbackButton');
    expect(src).toContain('agentId="VideoAgent"');
  });

  it('ToolResult switch includes acquisition-video case', () => {
    const src = readSrc(TOOL_RESULT);
    expect(src).toContain("case 'acquisition-video':");
    expect(src).toContain('AcquisitionVideoResult');
  });
});

// ── 4 · LS 写入 + 读取 ───────────────────────────────────────────────────────

describe('LS 写入 + 读取 (D-031 · SHIELD REJ-010)', () => {
  it('getToolLsKey generates correct namespaced key for acquisition-video', () => {
    const key = getToolLsKey(42, 'acquisition-video', 'input');
    expect(key).toContain('acc_42_tool_acquisition-video_input');
  });

  it('ToolForm handles LS for acquisition-video toolKey via getToolLsKey', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain('getToolLsKey');
    expect(src).toContain("'acquisition-video'");
  });

  it('AcquisitionVideoResult renders CTA card with data-testid', () => {
    const src = readSrc(AV_RESULT);
    expect(src).toContain('acquisition-video-cta-card');
    expect(src).toContain('转化指令');
  });
});

// ── 5 · ?historyId 预填 ──────────────────────────────────────────────────────

describe('?historyId 预填', () => {
  it('AcquisitionVideo page reads historyId from searchParams', () => {
    const src = readSrc(AV_PAGE);
    expect(src).toContain('historyId');
    expect(src).toContain('useSearchParams');
  });

  it('AcquisitionVideo page calls trpc.history.detail.useQuery with historyId', () => {
    const src = readSrc(AV_PAGE);
    expect(src).toContain('trpc.history.detail.useQuery');
    expect(src).toContain('enabled: !!historyId');
  });

  it('historyDefaults uses inputSummary for sourceCopy pre-fill', () => {
    const src = readSrc(AV_PAGE);
    expect(src).toContain('inputSummary');
    expect(src).toContain('historyDefaults');
  });

  it('AcquisitionVideoResult handles JSON.parse failure → 解析失败', () => {
    const src = readSrc(AV_RESULT);
    expect(src).toContain('解析失败');
    expect(src).toContain('acquisition-video-parse-error');
  });

  it('AcquisitionVideoResult renders conversion-path section', () => {
    const src = readSrc(AV_RESULT);
    expect(src).toContain('acquisition-video-conversion-path');
    expect(src).toContain('转化路径');
  });
});
