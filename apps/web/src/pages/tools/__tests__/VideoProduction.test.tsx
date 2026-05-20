/**
 * PRD-25 US-006 · VideoProduction unit tests
 * AC-8: ≥ 5 tests · mock trpc · 验证 H3 渲染真数据 + isFallback + retry
 * SHIELD: mock data 字段从 VideoAgent.ts production mode inferred (AC-8 anti_pattern fix)
 */
import { act, render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import VideoProduction from '@/pages/tools/VideoProduction';

// ── Mock control ──────────────────────────────────────────────────────────────

const mockCtrl = vi.hoisted(() => ({
  onSuccess: undefined as ((data: unknown) => void) | undefined,
  onError: undefined as ((error: unknown) => void) | undefined,
  isPending: false,
}));

// ── Mock data (fields 1:1 from VideoAgent.ts ProductionOutputSchema) ──────────

const MOCK_PRODUCTION_ROW = vi.hoisted(() => ({
  id: 1,
  content: JSON.stringify({
    shotList: [
      {
        scene: '制作开场',
        duration: '3s',
        action: '镜头从产品特写拉远至全景',
        dialogue: '欢迎来到今天的精彩内容，我来分享一个改变命运的方法',
        cameraAngle: '近景拉远',
        prop: '产品道具',
        lighting: '三点布光',
        transition: '缓推',
        sfx: '开场音效',
        voiceover: '今天我要分享的内容非常重要',
        subtitle: '开场字幕',
        costume: '商务休闲',
        location: '专业摄影棚',
        index: 1,
        angle: '近景',
        movement: '拉远',
        description: '镜头从产品特写拉远展示整体场景',
        bgm: '轻快开场音乐',
        reference: '参考样片A',
        note: '注意灯光',
      },
      {
        scene: '核心内容展示',
        duration: '30s',
        action: '详细展示核心内容',
        dialogue: '这个方法帮助了数百位创作者从0到10万粉丝',
        cameraAngle: '中景',
        prop: '演示图表',
        lighting: '补光灯',
        transition: '跳切',
        sfx: '背景音乐',
        voiceover: '核心卖点阐述旁白内容',
        subtitle: '关键信息字幕',
        costume: '同开场',
        location: '同开场',
        index: 2,
        angle: '中景',
        movement: '摇',
        description: '多角度展示核心内容',
        bgm: '专业背景音乐',
        reference: '无',
        note: '无',
      },
    ],
    equipment: ['专业相机', '三脚架', '补光灯', '麦克风'],
    schedule: '拍摄时间约 2-3 小时，建议周六上午 9-12 点',
  }),
  contentType: 'json',
  agentId: 'VideoAgent',
  agentMode: 'production',
  scriptType: null,
  elements: [],
  isFallback: false,
  tokensUsed: 200,
  modelUsed: 'claude-sonnet-4-5',
  durationMs: 8000,
  traceId: null,
  createdAt: new Date(),
}));

const MOCK_FALLBACK_ROW = vi.hoisted(() => ({
  id: 2,
  content: JSON.stringify({
    shotList: [
      {
        scene: '备用开场',
        duration: '3s',
        action: '备用动作',
        dialogue: '这是备用台词内容（系统繁忙备用）',
        cameraAngle: '正面',
        prop: '无',
        lighting: '自然光',
        transition: '淡出',
        sfx: '无',
        voiceover: '备用旁白',
        subtitle: '备用字幕',
        costume: '休闲',
        location: '室内',
        index: 1,
        angle: '中景',
        movement: '固定',
        description: '备用画面描述',
        bgm: '无',
        reference: '无',
        note: '备用',
      },
    ],
    equipment: ['手机', '三脚架'],
    schedule: '备用拍摄安排（系统繁忙备用）',
  }),
  contentType: 'json',
  agentId: 'VideoAgent',
  agentMode: 'production',
  scriptType: null,
  elements: [],
  isFallback: true,
  tokensUsed: 0,
  modelUsed: 'fallback',
  durationMs: 0,
  traceId: null,
  createdAt: new Date(),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/trpc', () => ({
  trpc: {
    videoProduction: {
      generate: {
        useMutation: (opts?: {
          onSuccess?: (data: unknown) => void;
          onError?: (error: unknown) => void;
        }) => {
          mockCtrl.onSuccess = opts?.onSuccess;
          mockCtrl.onError = opts?.onError;
          return {
            mutate: vi.fn(),
            isPending: mockCtrl.isPending,
            isError: false,
          };
        },
      },
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function renderVideoProduction() {
  return render(
    <MemoryRouter>
      <VideoProduction />
    </MemoryRouter>,
  );
}

function fillAndSubmit(text = '这是一段超过十个字的短视频文案内容测试') {
  const textarea = screen.getByPlaceholderText(/至少 10 个字/);
  fireEvent.change(textarea, { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: '生成制作方案' }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VideoProduction', () => {
  beforeEach(() => {
    mockCtrl.isPending = false;
    mockCtrl.onSuccess = undefined;
    mockCtrl.onError = undefined;
  });

  it('AC-1 · H1 字面锁 "短视频一键制作"', () => {
    renderVideoProduction();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('短视频一键制作');
  });

  it('AC-1 · 副标题包含 "AI 自动生成分镜脚本、拍摄方案、口播提词器和剪辑指导"', () => {
    renderVideoProduction();
    expect(screen.getByText(/AI 自动生成分镜脚本、拍摄方案、口播提词器和剪辑指导/)).toBeInTheDocument();
  });

  it('AC-1 · CTA "生成制作方案" 初始 disabled (text < 10 字)', () => {
    renderVideoProduction();
    expect(screen.getByRole('button', { name: '生成制作方案' })).toBeDisabled();
  });

  it('AC-1 · text ≥ 10 字 → CTA enabled', () => {
    renderVideoProduction();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '这是一段超过十个字的短视频文案测试内容' } });
    expect(screen.getByRole('button', { name: '生成制作方案' })).not.toBeDisabled();
  });

  it('AC-2 · onSuccess → 4 H3 区块渲染', () => {
    renderVideoProduction();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_PRODUCTION_ROW);
    });

    expect(screen.getByRole('heading', { level: 3, name: '分镜脚本' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '拍摄方案' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '口播提词器' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '剪辑指导' })).toBeInTheDocument();
  });

  it('AC-2 · production output 真实数据内容渲染 (shotList/equipment/schedule)', () => {
    renderVideoProduction();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_PRODUCTION_ROW);
    });

    // shotList rendered
    const shotList = screen.getByTestId('vp-shot-list');
    expect(shotList).toBeInTheDocument();
    expect(within(shotList).getAllByText(/制作开场/).length).toBeGreaterThan(0);
    // equipment rendered
    expect(screen.getByTestId('vp-equipment')).toBeInTheDocument();
    expect(screen.getByText('专业相机')).toBeInTheDocument();
    // schedule rendered
    expect(screen.getByTestId('vp-schedule')).toBeInTheDocument();
    expect(screen.getByText(/周六上午/)).toBeInTheDocument();
    // teleprompter dialogue
    expect(screen.getByTestId('vp-teleprompter')).toBeInTheDocument();
    expect(screen.getByText(/欢迎来到今天的精彩内容/)).toBeInTheDocument();
  });

  it('AC-5 · isFallback=true → 显示 fallback banner + retry button', () => {
    renderVideoProduction();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_FALLBACK_ROW);
    });

    expect(screen.getByTestId('video-production-fallback-banner')).toBeInTheDocument();
    expect(screen.getByText(/AI 暂未生成制作方案 · 显示备用模板/)).toBeInTheDocument();
    expect(screen.getByTestId('video-production-retry')).toBeInTheDocument();
  });

  it('AC-5 · isFallback=false → 不显示 fallback banner', () => {
    renderVideoProduction();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_PRODUCTION_ROW);
    });

    expect(screen.queryByTestId('video-production-fallback-banner')).not.toBeInTheDocument();
  });

  it('AC-6 · onError → toast.error 被调用', async () => {
    const { toast } = await import('sonner');
    renderVideoProduction();
    fillAndSubmit();

    act(() => {
      mockCtrl.onError?.(new Error('Network error'));
    });

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('生成失败'));
  });
});
