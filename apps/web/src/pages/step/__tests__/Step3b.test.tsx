import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Step3b, { type Step3bResult } from '@/pages/step/Step3b';

// ── Minimal Step3bResult fixture (真实后端形状) ────────────────────────────────
const MOCK_STEP3B_RESULT: Step3bResult = {
  coreIdentity: {
    identityTag: 'TEST·AI转型实战家',
    quote: '"测试金句"',
    differentiation: '测试差异化说明',
    memoryPoints: [
      { title: '测试记忆点1', desc: '描述1', practice: '实践1' },
      { title: '测试记忆点2', desc: '描述2', practice: '实践2' },
    ],
    traits: [
      { name: '实战派', desc: '真实' },
      { name: '韧性强', desc: '坚韧' },
    ],
  },
  thoughtSystem: {
    coreBeliefs: [
      { belief: '测试核心信念', reason: '原因', angle: '角度' },
    ],
    viewpoints: [
      { title: '测试独特观点', desc: '观点描述', exampleTitle: '示例标题' },
    ],
    mottos: [
      { motto: '"测试金句"', whenToUse: '测试场景', effect: '测试效果' },
    ],
  },
  contentPersona: {
    speakingStyle: '测试表达风格',
    speakingDos: ['建议A'],
    speakingDonts: ['避免A'],
    examplePitch: '测试示例开场白',
    visualStyle: {
      style: '测试整体风格',
      outfit: '测试穿搭',
      scene: '测试场景',
      props: ['道具1'],
    },
    contentPillars: [
      { title: '测试支柱1', percentage: '40%', frequency: '每周2次', desc: '描述', cases: ['案例'] },
      { title: '测试支柱2', percentage: '30%', frequency: '每周1次', desc: '描述', cases: ['案例'] },
    ],
  },
  trustSystem: {
    backings: [
      { claim: '测试背书1', display: '展示方法1' },
      { claim: '测试背书2', display: '展示方法2' },
    ],
    socialProofs: [
      { proof: '测试社会证明', method: '方法' },
    ],
    storyLine: {
      mainStory: '测试核心故事',
      turningPoint: '测试转折点',
      narrationMethod: '测试叙事方式',
    },
  },
  roadmap: [
    { period: '0-1个月', accent: 'green', goal: '测试目标1', steps: ['步骤1'] },
    { period: '1-3个月', accent: 'yellow', goal: '测试目标2', steps: ['步骤2'] },
    { period: '3-6个月', accent: 'purple', goal: '测试目标3', steps: ['步骤3'] },
  ],
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

function renderStep3b() {
  return render(
    <MemoryRouter>
      <Step3b />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Step3b', () => {
  // ── 字面锁 / H1 / 基础结构 ────────────────────────────────────────────────

  it('renders h1 with correct title', () => {
    renderStep3b();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('STEP 03b · 深度人设分析');
  });

  it('renders H2 输入人设参数 form section', () => {
    renderStep3b();
    expect(screen.getByRole('heading', { level: 2, name: /输入人设参数/ })).toBeInTheDocument();
  });

  it('renders CTA button with locked label 生成专属人设方案', () => {
    renderStep3b();
    expect(screen.getByRole('button', { name: /生成专属人设方案/ })).toBeInTheDocument();
  });

  it('renders 你的个人信息 textarea label', () => {
    renderStep3b();
    expect(screen.getByText('你的个人信息')).toBeInTheDocument();
  });

  // ── 真数据渲染 · dbQuery result ───────────────────────────────────────────

  it('renders report identityTag from dbQuery result (Step3bResult shape)', () => {
    mockState.getQuery.data = {
      result: MOCK_STEP3B_RESULT,
      stepKey: 'step3b',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep3b();
    expect(screen.getByText('TEST·AI转型实战家')).toBeInTheDocument();
    expect(screen.getByText('0-1个月')).toBeInTheDocument();
  });

  it('renders roadmap period from dbQuery result', () => {
    mockState.getQuery.data = {
      result: MOCK_STEP3B_RESULT,
      stepKey: 'step3b',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep3b();
    expect(screen.getByText('1-3个月')).toBeInTheDocument();
    expect(screen.getByText('3-6个月')).toBeInTheDocument();
  });

  // ── 真数据渲染 · mutation 成功后 session result ────────────────────────────

  it('renders identityTag from mutation session result', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_STEP3B_RESULT,
        stepKey: 'step3b',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep3b();
    expect(screen.getByText('TEST·AI转型实战家')).toBeInTheDocument();
    expect(screen.getByText('测试差异化说明')).toBeInTheDocument();
  });

  // ── Loading 态 ─────────────────────────────────────────────────────────────

  it('shows loading banner (step3b-loading testid) when mutation isPending', () => {
    mockState.saveMutation.isPending = true;
    renderStep3b();
    expect(screen.getByTestId('step3b-loading')).toBeInTheDocument();
    // STEP3B_LOADING_TEXT: 'AI 正在生成你的专属人设方案，预计 30-60 秒...'
    expect(screen.getByTestId('step3b-loading')).toHaveTextContent('AI 正在生成你的专属人设方案');
  });

  it('CTA button shows 生成中… when isPending', () => {
    mockState.saveMutation.isPending = true;
    renderStep3b();
    expect(screen.getByRole('button', { name: /生成中/ })).toBeInTheDocument();
  });

  // ── Error 态 ───────────────────────────────────────────────────────────────

  it('shows error banner (step3b-error testid) when mutation isError', () => {
    mockState.saveMutation.isError = true;
    mockState.saveMutation.error = { message: '生成失败，请重试' };
    renderStep3b();
    expect(screen.getByTestId('step3b-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
  });

  // ── isFallback 降级提示 ────────────────────────────────────────────────────

  it('shows fallback notice (step3b-fallback-notice testid) when isFallback=true', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_STEP3B_RESULT,
        stepKey: 'step3b',
        inputs: {},
        isFallback: true,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep3b();
    expect(screen.getByTestId('step3b-fallback-notice')).toBeInTheDocument();
  });

  it('does NOT show fallback notice when isFallback=false', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_STEP3B_RESULT,
        stepKey: 'step3b',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep3b();
    expect(screen.queryByTestId('step3b-fallback-notice')).not.toBeInTheDocument();
  });

  // ── 无真数据 → 不显报告、显空态 ──────────────────────────────────────────────

  it('does NOT render report section when no real data available', () => {
    // No mutation data, no dbQuery data (default state)
    renderStep3b();
    expect(screen.queryByText(/数据洞察/)).not.toBeInTheDocument();
    expect(screen.queryByText(/核心定位基因/)).not.toBeInTheDocument();
    expect(screen.queryByText(/IP 孵化成长路线图/)).not.toBeInTheDocument();
  });

  it('shows empty state when no real data and not loading', () => {
    renderStep3b();
    expect(screen.getByTestId('step3b-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/尚未生成人设方案/)).toBeInTheDocument();
  });

  it('does NOT show empty state while mutation is pending', () => {
    mockState.saveMutation.isPending = true;
    renderStep3b();
    expect(screen.queryByTestId('step3b-empty-state')).not.toBeInTheDocument();
  });

  it('does NOT show empty state while dbQuery is loading', () => {
    mockState.getQuery.isLoading = true;
    renderStep3b();
    expect(screen.queryByTestId('step3b-empty-state')).not.toBeInTheDocument();
  });

  // ── 有真数据 → 报告渲染真数据 ─────────────────────────────────────────────────

  it('renders report section when dbQuery has valid result', () => {
    mockState.getQuery.data = {
      result: MOCK_STEP3B_RESULT,
      stepKey: 'step3b',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep3b();
    expect(screen.getByText(/数据洞察/)).toBeInTheDocument();
    expect(screen.getByText('TEST·AI转型实战家')).toBeInTheDocument();
    expect(screen.queryByTestId('step3b-empty-state')).not.toBeInTheDocument();
  });

  it('does NOT render report for invalid/malformed result (guard rejected)', () => {
    mockState.getQuery.data = {
      result: { broken: true }, // not a valid Step3bResult
      stepKey: 'step3b',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep3b();
    expect(screen.queryByText(/数据洞察/)).not.toBeInTheDocument();
    expect(screen.getByTestId('step3b-empty-state')).toBeInTheDocument();
  });

  // ── dbQuery isFallback → 降级提示 ────────────────────────────────────────────

  it('shows fallback notice when dbQuery.data.isFallback=true', () => {
    mockState.getQuery.data = {
      result: MOCK_STEP3B_RESULT,
      stepKey: 'step3b',
      inputs: {},
      isFallback: true,
      version: 1,
      updatedAt: '',
    };
    renderStep3b();
    expect(screen.getByTestId('step3b-fallback-notice')).toBeInTheDocument();
  });

  // ── dbQuery.isError → 加载失败提示 ───────────────────────────────────────────

  it('shows db error banner with retry when dbQuery.isError=true and no real data', () => {
    mockState.getQuery.isError = true;
    renderStep3b();
    expect(screen.getByTestId('step3b-db-error')).toBeInTheDocument();
    expect(screen.getByText(/历史记录加载失败/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
  });

  it('does NOT show db error banner when dbQuery.isError=true but real data available', () => {
    mockState.getQuery.isError = true;
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_STEP3B_RESULT,
        stepKey: 'step3b',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep3b();
    expect(screen.queryByTestId('step3b-db-error')).not.toBeInTheDocument();
  });

  // ── dbQuery.isLoading → 历史记录加载中 ───────────────────────────────────────

  it('shows db loading banner while dbQuery.isLoading=true', () => {
    mockState.getQuery.isLoading = true;
    renderStep3b();
    expect(screen.getByTestId('step3b-db-loading')).toBeInTheDocument();
    expect(screen.getByText(/正在加载历史记录/)).toBeInTheDocument();
  });
});
