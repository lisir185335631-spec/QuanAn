import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Step6, { type ShootingOutput } from '@/pages/step/Step6';

// ── Minimal ShootingOutput fixture (真实后端形状 · VideoAgent shooting mode) ──
const MOCK_SHOOTING_RESULT: ShootingOutput = {
  shotList: [
    {
      duration: '3s',
      scene: '室内办公室',
      shotType: '正面中景',
      angle: '平角',
      movement: '固定',
      emotion: '自信热情',
      dialogue: '大家好，欢迎来到今天的内容',
      action: '主持人入镜，面向镜头',
    },
    {
      duration: '10s',
      scene: '咖啡馆',
      shotType: '侧面中景',
      angle: '平角',
      movement: '推近',
      emotion: '轻松愉快',
      dialogue: '今天我要分享一个非常重要的话题',
      action: '坐在椅子上，双手摊开',
    },
  ],
  equipment: ['手机', '三脚架', '补光灯'],
  schedule: '拍摄时间约 1-2 小时，建议上午 9-11 点',
};

// ── vi.hoisted mutable mock state ─────────────────────────────────────────────
const mockState = vi.hoisted(() => ({
  saveMutation: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null as { message: string } | null,
    data: undefined as unknown,
  },
  getQuery: {
    data: null as unknown,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  },
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      get: { useQuery: () => mockState.getQuery },
      save: { useMutation: () => mockState.saveMutation },
    },
    // US-P03: 呈现形式并入 Step6 · 需 mock presentStyles.recommend
    presentStyles: {
      recommend: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
          isError: false,
          data: undefined,
        }),
      },
    },
  },
}));

// ── Reset state before each test ──────────────────────────────────────────────
beforeEach(() => {
  mockState.saveMutation.mutate = vi.fn();
  mockState.saveMutation.isPending = false;
  mockState.saveMutation.isError = false;
  mockState.saveMutation.error = null;
  mockState.saveMutation.data = undefined;

  mockState.getQuery.data = null;
  mockState.getQuery.isLoading = false;
  mockState.getQuery.isError = false;
  mockState.getQuery.error = null;
  mockState.getQuery.refetch = vi.fn();
});

function renderStep6() {
  return render(
    <MemoryRouter>
      <Step6 />
    </MemoryRouter>,
  );
}

describe('Step6', () => {
  // ── 字面锁 / H1 / 基础结构 ────────────────────────────────────────────────

  it('renders h1 with 拍摄计划', () => {
    renderStep6();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('拍摄计划');
  });

  it('renders STEP_TAG literal', () => {
    renderStep6();
    expect(
      screen.getByText((content) => content.includes('STEP 06') && content.includes('拍摄计划')),
    ).toBeInTheDocument();
  });

  it('renders subtitle describing AI generation capability', () => {
    renderStep6();
    expect(screen.getByText(/专业级内容生产流程，让每一帧都有意义/)).toBeInTheDocument();
  });

  it('renders generate button', () => {
    renderStep6();
    expect(screen.getByRole('button', { name: /生成拍摄计划/ })).toBeInTheDocument();
  });

  it('generate button is disabled when textarea is empty', () => {
    renderStep6();
    // US-P03 adds a second textarea (ps-text); target the shooting plan textarea by placeholder
    const textarea = screen.getByPlaceholderText(/输入你的视频脚本文案/);
    fireEvent.change(textarea, { target: { value: '' } });
    const btn = screen.getByRole('button', { name: /生成拍摄计划/ });
    expect(btn).toBeDisabled();
  });

  // ── 无真数据 → 不显结果区、显空态 ───────────────────────────────────────────

  it('shows empty state when no real data and not loading', () => {
    renderStep6();
    expect(screen.getByTestId('step6-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/尚未生成拍摄计划/)).toBeInTheDocument();
  });

  it('does NOT show results section when no real data', () => {
    renderStep6();
    expect(screen.queryByText(/数据洞察/)).not.toBeInTheDocument();
    // 结果区 h3 只在有真结果时渲染(区别于 subtitle 中提及的"分镜脚本")
    expect(screen.queryByRole('heading', { level: 3, name: /分镜脚本/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/拍摄设备/)).not.toBeInTheDocument();
  });

  it('does NOT show empty state while mutation is pending', () => {
    mockState.saveMutation.isPending = true;
    renderStep6();
    expect(screen.queryByTestId('step6-empty-state')).not.toBeInTheDocument();
  });

  it('does NOT show empty state while dbQuery is loading', () => {
    mockState.getQuery.isLoading = true;
    renderStep6();
    expect(screen.queryByTestId('step6-empty-state')).not.toBeInTheDocument();
  });

  // ── Loading 态 ─────────────────────────────────────────────────────────────

  it('shows loading banner (step6-loading testid) when mutation isPending', () => {
    mockState.saveMutation.isPending = true;
    renderStep6();
    expect(screen.getByTestId('step6-loading')).toBeInTheDocument();
    expect(screen.getByTestId('step6-loading')).toHaveTextContent('AI 正在生成拍摄计划');
  });

  it('CTA button shows 生成中… when isPending', () => {
    mockState.saveMutation.isPending = true;
    renderStep6();
    expect(screen.getByRole('button', { name: /生成中/ })).toBeInTheDocument();
  });

  // ── Error 态 ───────────────────────────────────────────────────────────────

  it('shows error banner (step6-error testid) when mutation isError', () => {
    mockState.saveMutation.isError = true;
    mockState.saveMutation.error = { message: '生成失败，请重试' };
    renderStep6();
    expect(screen.getByTestId('step6-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
  });

  // ── 真数据渲染 · dbQuery result ───────────────────────────────────────────

  it('renders shotList items from dbQuery result (ShootingOutput shape)', () => {
    mockState.getQuery.data = {
      result: MOCK_SHOOTING_RESULT,
      stepKey: 'step6',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep6();
    // 场景字段渲染
    expect(screen.getByText('室内办公室')).toBeInTheDocument();
    expect(screen.getByText('咖啡馆')).toBeInTheDocument();
    // 台词字段渲染
    expect(screen.getByText('大家好，欢迎来到今天的内容')).toBeInTheDocument();
  });

  it('renders equipment from dbQuery result', () => {
    mockState.getQuery.data = {
      result: MOCK_SHOOTING_RESULT,
      stepKey: 'step6',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep6();
    expect(screen.getByText('手机')).toBeInTheDocument();
    expect(screen.getByText('三脚架')).toBeInTheDocument();
    expect(screen.getByText('补光灯')).toBeInTheDocument();
  });

  it('renders schedule from dbQuery result', () => {
    mockState.getQuery.data = {
      result: MOCK_SHOOTING_RESULT,
      stepKey: 'step6',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep6();
    // schedule 在 KPI 卡(截断)和结果区(完整)各渲染一次 · 用 getAllByText
    const scheduleEls = screen.getAllByText(/拍摄时间约 1-2 小时/);
    expect(scheduleEls.length).toBeGreaterThanOrEqual(1);
  });

  it('renders data insights section when result present', () => {
    mockState.getQuery.data = {
      result: MOCK_SHOOTING_RESULT,
      stepKey: 'step6',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep6();
    expect(screen.getByText(/数据洞察/)).toBeInTheDocument();
    expect(screen.queryByTestId('step6-empty-state')).not.toBeInTheDocument();
  });

  // ── 真数据渲染 · mutation 成功后 session result ────────────────────────────

  it('renders shotList items from mutation session result', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_SHOOTING_RESULT,
        stepKey: 'step6',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep6();
    expect(screen.getByText('室内办公室')).toBeInTheDocument();
    expect(screen.getByText('主持人入镜，面向镜头')).toBeInTheDocument();
  });

  // ── isFallback 降级提示 ────────────────────────────────────────────────────

  it('shows fallback notice (step6-fallback-notice testid) when isFallback=true', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_SHOOTING_RESULT,
        stepKey: 'step6',
        inputs: {},
        isFallback: true,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep6();
    expect(screen.getByTestId('step6-fallback-notice')).toBeInTheDocument();
    expect(screen.getByTestId('step6-fallback-notice')).toHaveTextContent('AI 模型降级处理');
  });

  it('does NOT show fallback notice when isFallback=false', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_SHOOTING_RESULT,
        stepKey: 'step6',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep6();
    expect(screen.queryByTestId('step6-fallback-notice')).not.toBeInTheDocument();
  });

  // ── 守卫: 伪造数据不渲染结果 ──────────────────────────────────────────────────

  it('does NOT render result section when dbQuery result shape is invalid', () => {
    mockState.getQuery.data = {
      result: { bad: 'shape' }, // 不是 ShootingOutput
      stepKey: 'step6',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep6();
    // 结果区 h3 不渲染(守卫生效)
    expect(screen.queryByRole('heading', { level: 3, name: /分镜脚本/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('step6-empty-state')).toBeInTheDocument();
  });
});
