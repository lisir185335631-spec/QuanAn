/**
 * PRD-25 US-006 · AcquisitionVideo unit tests
 * AC-8: ≥ 5 tests · mock trpc · 验证 H4 渲染真数据 + isFallback + retry
 * SHIELD: mock data 字段从 VideoAgent.ts acquisition mode inferred
 *   router stores content as { script, ctaScript(=cta renamed), conversionPath, keyMessages }
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import AcquisitionVideo from '@/pages/tools/AcquisitionVideo';

// ── Mock control ──────────────────────────────────────────────────────────────

const mockCtrl = vi.hoisted(() => ({
  onSuccess: undefined as ((data: unknown) => void) | undefined,
  onError: undefined as ((error: unknown) => void) | undefined,
  isPending: false,
}));

// ── Mock data (fields 1:1 from acquisitionVideo router contentData) ───────────

const MOCK_ACQUISITION_ROW = vi.hoisted(() => ({
  id: 1,
  content: JSON.stringify({
    // router renames: cta → ctaScript
    script:
      '你是否每天辛苦做内容，粉丝增长却停滞不前？今天分享一个经过验证的方法，帮助你快速突破瓶颈，实现精准涨粉。我们的体系已帮助数百位创作者从 0 到 10 万粉丝，现在这个机会也属于你，立刻行动！',
    ctaScript: '立即扫描下方二维码，免费获取详细涨粉方案，限时名额，先到先得！',
    conversionPath: '视频引流→扫码→咨询群→成交',
    keyMessages: ['经验证的涨粉方法', '针对创作者的专属方案', '免费咨询了解详情'],
  }),
  contentType: 'json',
  agentId: 'VideoAgent',
  agentMode: 'acquisition',
  scriptType: null,
  elements: [],
  isFallback: false,
  tokensUsed: 150,
  modelUsed: 'claude-sonnet-4-5',
  durationMs: 5000,
  traceId: null,
  createdAt: new Date(),
}));

const MOCK_FALLBACK_ROW = vi.hoisted(() => ({
  id: 2,
  content: JSON.stringify({
    script: '备用获客脚本内容（系统繁忙备用）',
    ctaScript: '立即联系我们获取备用方案',
    conversionPath: '备用转化路径',
    keyMessages: ['备用卖点1', '备用卖点2'],
  }),
  contentType: 'json',
  agentId: 'VideoAgent',
  agentMode: 'acquisition',
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
    acquisitionVideo: {
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

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: {
      id: 1,
      name: 'AI 创业者小张',
      industry: '企业服务',
      platform: 'douyin',
      stage: 'starter',
    },
    switchTo: vi.fn(),
    isSwitching: false,
    isLoading: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function renderAcquisitionVideo() {
  return render(
    <MemoryRouter>
      <AcquisitionVideo />
    </MemoryRouter>,
  );
}

function fillFormAndSubmit() {
  fireEvent.change(screen.getByTestId('acq-industry-select'), {
    target: { value: '企业服务' },
  });
  fireEvent.change(screen.getByTestId('acq-audience-textarea'), {
    target: { value: '想要创业的30-45岁宝妈群体，有一定积蓄但缺乏方向' },
  });
  fireEvent.change(screen.getByTestId('acq-selling-points-textarea'), {
    target: { value: '0基础可学、3个月回本、一对一指导' },
  });
  fireEvent.click(screen.getByRole('button', { name: '生成获客方案' }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AcquisitionVideo', () => {
  beforeEach(() => {
    mockCtrl.isPending = false;
    mockCtrl.onSuccess = undefined;
    mockCtrl.onError = undefined;
  });

  it('AC-1 · H1 字面锁 "获客型视频制作"', () => {
    renderAcquisitionVideo();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('获客型视频制作');
  });

  it('AC-1 · 副标题字面锁 "专为获客设计的短视频方案，让精准客户主动找上门"', () => {
    renderAcquisitionVideo();
    expect(screen.getByText(/专为获客设计的短视频方案，让精准客户主动找上门/)).toBeInTheDocument();
  });

  it('AC-3 · CTA "生成获客方案" 初始 disabled (audience + sellingPoints 为空)', () => {
    renderAcquisitionVideo();
    expect(screen.getByRole('button', { name: '生成获客方案' })).toBeDisabled();
  });

  it('AC-3 · 填写 audience + sellingPoints → CTA enabled', () => {
    renderAcquisitionVideo();
    // industry defaults from mocked account (企业服务) via useEffect
    fireEvent.change(screen.getByTestId('acq-industry-select'), {
      target: { value: '企业服务' },
    });
    fireEvent.change(screen.getByTestId('acq-audience-textarea'), {
      target: { value: '想要创业的宝妈群体，有一定积蓄' },
    });
    fireEvent.change(screen.getByTestId('acq-selling-points-textarea'), {
      target: { value: '0基础可学、3个月回本' },
    });
    expect(screen.getByRole('button', { name: '生成获客方案' })).not.toBeDisabled();
  });

  it('AC-4 · onSuccess → 4 H4 区块渲染真数据', () => {
    renderAcquisitionVideo();
    fillFormAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_ACQUISITION_ROW);
    });

    expect(screen.getByRole('heading', { level: 4, name: '主题角度' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '钩子' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '内容结构' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'CTA' })).toBeInTheDocument();
  });

  it('AC-4 · acquisition output 真实内容渲染 (script/ctaScript/conversionPath/keyMessages)', () => {
    renderAcquisitionVideo();
    fillFormAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_ACQUISITION_ROW);
    });

    expect(screen.getByTestId('acq-theme-angle')).toHaveTextContent(/帮助你快速突破瓶颈/);
    expect(screen.getByTestId('acq-cta')).toHaveTextContent(/立即扫描下方二维码/);
    expect(screen.getByTestId('acq-content-structure')).toHaveTextContent('视频引流→扫码→咨询群→成交');
    expect(screen.getByTestId('acq-hook')).toHaveTextContent(/经验证的涨粉方法/);
  });

  it('AC-5 · isFallback=true → 显示 fallback banner + retry button', () => {
    renderAcquisitionVideo();
    fillFormAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_FALLBACK_ROW);
    });

    expect(screen.getByTestId('acquisition-video-fallback-banner')).toBeInTheDocument();
    expect(screen.getByText(/AI 暂未生成获客方案 · 显示备用模板/)).toBeInTheDocument();
    expect(screen.getByTestId('acquisition-video-retry')).toBeInTheDocument();
  });

  it('AC-5 · isFallback=false → 不显示 fallback banner', () => {
    renderAcquisitionVideo();
    fillFormAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_ACQUISITION_ROW);
    });

    expect(screen.queryByTestId('acquisition-video-fallback-banner')).not.toBeInTheDocument();
  });

  it('AC-6 · onError → toast.error 被调用', async () => {
    const { toast } = await import('sonner');
    renderAcquisitionVideo();
    fillFormAndSubmit();

    act(() => {
      mockCtrl.onError?.(new Error('Server error'));
    });

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('生成失败'));
  });

  it('AC-5 · industry select 有 "企业服务" 选项可被选中', () => {
    renderAcquisitionVideo();
    const select = screen.getByTestId('acq-industry-select');
    fireEvent.change(select, { target: { value: '企业服务' } });
    expect((select as HTMLSelectElement).value).toBe('企业服务');
  });
});
