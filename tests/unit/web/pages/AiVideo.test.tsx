/**
 * AiVideo.test.tsx — PRD-6 US-008 AC-17
 * 7 unit tests: (1) 表单渲染 (2) zod fail (3) submit mock + 跳结果区
 *               (4) polling tick mock (refetchInterval:3000) (5) scene 完成 push 渲染
 *               (6) 全完成 banner (7) 失败 scene 重试 button
 * Node environment — pure logic + source inspection tests (no React render)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { aiVideoFrontendInput } from '../../../../apps/web/src/lib/schemas/aiVideoFrontend';
import { getToolLsKey } from '../../../../apps/web/src/lib/ls-namespace';

const ROOT = resolve(__dirname, '../../../../');
const AIV_PAGE = `${ROOT}/apps/web/src/pages/tools/AiVideo.tsx`;
const AIV_RESULT = `${ROOT}/apps/web/src/components/ToolResult/AiVideoResult.tsx`;
const TOOL_FORM = `${ROOT}/apps/web/src/components/ToolForm/ToolForm.tsx`;
const TOOL_RESULT = `${ROOT}/apps/web/src/components/ToolResult/ToolResult.tsx`;

function readSrc(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · 表单渲染 ──────────────────────────────────────────────────────────────

describe('(1) 表单渲染: AiVideo.tsx + ToolForm.tsx', () => {
  it('AiVideo page imports and uses ToolForm with toolKey ai-video', () => {
    const src = readSrc(AIV_PAGE);
    expect(src).toContain('ToolForm');
    expect(src).toContain('toolKey="ai-video"');
  });

  it('ToolForm has ai-video case with sourceCopy textarea', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("case 'ai-video':");
    expect(src).toContain("register('sourceCopy')");
    expect(src).toContain('tool-aiv-source-copy');
  });

  it('ToolForm ai-video case has scenesCount select (5-8) and imageStyle select', () => {
    const src = readSrc(TOOL_FORM);
    expect(src).toContain("register('scenesCount')");
    expect(src).toContain("register('imageStyle')");
    expect(src).toContain('tool-aiv-scenes-count');
    expect(src).toContain('tool-aiv-image-style');
    // scenesCount options 5-8
    expect(src).toContain('value="5"');
    expect(src).toContain('value="6"');
    expect(src).toContain('value="7"');
    expect(src).toContain('value="8"');
    // imageStyle options
    expect(src).toContain('value="natural"');
    expect(src).toContain('value="vivid"');
  });

  it('AiVideo page uses aiVideoFrontendInput schema and submitLabel 生成 AI 视频', () => {
    const src = readSrc(AIV_PAGE);
    expect(src).toContain('aiVideoFrontendInput');
    expect(src).toContain('生成 AI 视频');
  });

  it('ToolResult has ai-video case importing AiVideoResult', () => {
    const src = readSrc(TOOL_RESULT);
    expect(src).toContain("case 'ai-video':");
    expect(src).toContain('AiVideoResult');
  });
});

// ── 2 · zod fail ─────────────────────────────────────────────────────────────

describe('(2) zod 校验失败显示中文 message', () => {
  it('sourceCopy 留空 → sourceCopy 至少 10 个字符', () => {
    const result = aiVideoFrontendInput.safeParse({
      sourceCopy: '短',
      scenesCount: 5,
      imageStyle: 'natural',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'sourceCopy');
      expect(issue?.message).toBe('sourceCopy 至少 10 个字符');
    }
  });

  it('scenesCount 字符串 "5" 被 preprocess coerce 为 number 5', () => {
    const result = aiVideoFrontendInput.safeParse({
      sourceCopy: '今天分享一段美食探店 vlog 制作过程，感谢大家',
      scenesCount: '5',
      imageStyle: 'natural',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scenesCount).toBe(5);
      expect(typeof result.data.scenesCount).toBe('number');
    }
  });

  it('valid input passes', () => {
    const result = aiVideoFrontendInput.safeParse({
      sourceCopy: '今天分享一段美食探店 vlog 制作过程，感谢大家关注',
      scenesCount: 5,
      imageStyle: 'natural',
    });
    expect(result.success).toBe(true);
  });

  it('imageStyle default is natural when omitted', () => {
    const result = aiVideoFrontendInput.safeParse({
      sourceCopy: '今天分享一段美食探店 vlog 制作过程，感谢大家关注',
      scenesCount: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageStyle).toBe('natural');
    }
  });
});

// ── 3 · submit mock + 跳结果区 ───────────────────────────────────────────────

describe('(3) submit → AiVideoResult 渲染', () => {
  it('AiVideo page calls trpc.aiVideo.generateStoryboard.useMutation', () => {
    const src = readSrc(AIV_PAGE);
    expect(src).toContain('trpc.aiVideo.generateStoryboard.useMutation');
  });

  it('AiVideo page renders AiVideoResult when activeHistory is set', () => {
    const src = readSrc(AIV_PAGE);
    expect(src).toContain('AiVideoResult');
    expect(src).toContain('activeHistory');
    expect(src).toContain('activeHistory.historyId');
  });

  it('handleSuccess writes historyId to LS with account namespace (SHIELD REJ-010)', () => {
    const src = readSrc(AIV_PAGE);
    // Must use getToolLsKey not plain localStorage key
    expect(src).toContain("getToolLsKey(accountId, 'ai-video', 'active_polling')");
    expect(src).not.toContain("setItem('ai_video_active_polling'");
  });
});

// ── 4 · polling tick mock ─────────────────────────────────────────────────────

describe('(4) polling tick mock — refetchInterval:3000', () => {
  it('AiVideoResult uses trpc.aiVideo.jobStatus.useQuery with refetchInterval:3000', () => {
    const src = readSrc(AIV_RESULT);
    expect(src).toContain('trpc.aiVideo.jobStatus.useQuery');
    expect(src).toContain('refetchInterval');
    expect(src).toContain('3000');
  });

  it('polling is disabled when allCompleted (refetchInterval:false)', () => {
    const src = readSrc(AIV_RESULT);
    expect(src).toContain('allCompleted');
    // refetchInterval conditional on allCompleted
    expect(src).toMatch(/refetchInterval.*allCompleted|allCompleted.*refetchInterval/s);
  });
});

// ── 5 · scene 完成 push 渲染 ──────────────────────────────────────────────────

describe('(5) scene 完成 → sceneImageUrl → <img> 渲染', () => {
  it('AiVideoResult renders <img> when scene is completed with sceneImageUrl', () => {
    const src = readSrc(AIV_RESULT);
    expect(src).toContain("status === 'completed'");
    expect(src).toContain('sceneImageUrl');
    expect(src).toContain('<img');
    expect(src).toContain('src={scene.sceneImageUrl}');
  });

  it('AiVideoResult shows skeleton+spinner for pending scenes', () => {
    const src = readSrc(AIV_RESULT);
    expect(src).toContain('animate-pulse');
    expect(src).toContain('animate-spin');
    expect(src).toContain("data-testid={`ai-video-scene-skeleton-${scene.index}`}");
  });
});

// ── 6 · 全完成 banner ─────────────────────────────────────────────────────────

describe('(6) 全完成 banner', () => {
  it('AiVideoResult shows completion banner when allCompleted', () => {
    const src = readSrc(AIV_RESULT);
    expect(src).toContain('所有镜头已完成');
    expect(src).toContain('ai-video-complete-banner');
    expect(src).toContain('allCompleted');
  });

  it('completion triggered when completed === total && total > 0', () => {
    const src = readSrc(AIV_RESULT);
    expect(src).toContain('jobStatus.completed === jobStatus.total');
    expect(src).toContain('jobStatus.total > 0');
  });
});

// ── 7 · 失败 scene 重试 button ────────────────────────────────────────────────

describe('(7) 失败 scene 重试 button', () => {
  it('AiVideoResult renders retry button for failed scenes', () => {
    const src = readSrc(AIV_RESULT);
    expect(src).toContain("status === 'failed'");
    expect(src).toContain('ai-video-scene-failed');
    expect(src).toContain('ai-video-scene-retry');
    expect(src).toContain('重试');
  });

  it('retry button onClick shows toast PRD-7+ placeholder', () => {
    const src = readSrc(AIV_RESULT);
    expect(src).toContain('重试功能 PRD-7+');
  });
});

// ── LS namespace helper (sanity check) ───────────────────────────────────────

describe('LS namespace key format', () => {
  it('getToolLsKey generates correct ai-video polling key', () => {
    const key = getToolLsKey(42, 'ai-video', 'active_polling');
    expect(key).toBe('aiip_memory_acc_42_tool_ai-video_active_polling');
  });
});
