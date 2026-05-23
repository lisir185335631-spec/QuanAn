import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Step3 from '@/pages/step/Step3';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      get: { useQuery: () => ({ data: null, isLoading: false, isError: false, error: null, refetch: vi.fn() }) },
      save: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

function renderStep3() {
  return render(
    <MemoryRouter>
      <Step3 />
    </MemoryRouter>,
  );
}

describe('Step3 integration', () => {
  // ── 9 sub-component presence ──────────────────────────────────────────────

  it('renders Step3PageHeader H1 with "账号包装方案"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 1, name: /账号包装方案/ })).toBeInTheDocument();
  });

  it('renders hardcoded industry "美业" in header subtitle', () => {
    renderStep3();
    expect(screen.getByText('美业')).toBeInTheDocument();
  });

  it('renders Step3Form with primary CTA button', () => {
    renderStep3();
    expect(screen.getByText('生成账号包装方案')).toBeInTheDocument();
  });

  it('renders Step3SectionDivider H2 "账号包装方案"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 2, name: /账号包装方案/ })).toBeInTheDocument();
  });

  it('renders VideoReferenceCaseSection H3 "视频参考案例"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /视频参考案例/ })).toBeInTheDocument();
  });

  it('renders NicknameRecommendSection H3 "昵称推荐"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /昵称推荐/ })).toBeInTheDocument();
  });

  it('renders AvatarDesignSection H3 "头像设计方案"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /头像设计方案/ })).toBeInTheDocument();
  });

  it('renders BackgroundImageDesignSection H3 "背景图设计方案"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /背景图设计方案/ })).toBeInTheDocument();
  });

  it('renders IntroCopySection H3 "简介文案方案"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /简介文案方案/ })).toBeInTheDocument();
  });

  it('renders OverallStrategySection H3 "整体包装策略"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /整体包装策略/ })).toBeInTheDocument();
  });

  // ── AC-4: all 6 H3 sections always render (no conditional skip) ───────────

  it('renders all 6 H3 section headings simultaneously without any result data', () => {
    renderStep3();
    const h3Headings = screen.getAllByRole('heading', { level: 3 });
    const h3Texts = h3Headings.map((h) => h.textContent ?? '');
    expect(h3Texts.some((t) => /视频参考案例/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /昵称推荐/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /头像设计方案/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /背景图设计方案/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /简介文案方案/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /整体包装策略/.test(t))).toBe(true);
  });

  // ── AC-3: form basic interactions ────────────────────────────────────────

  it('CTA button is disabled when personalInfo is empty', () => {
    renderStep3();
    expect(screen.getByText('生成账号包装方案').closest('button')).toBeDisabled();
  });

  it('CTA button becomes enabled when personalInfo and platform are filled', () => {
    renderStep3();
    const textarea = screen.getByPlaceholderText(/详细描述你的个人背景/);
    fireEvent.change(textarea, { target: { value: '我是美容师' } });
    // click 抖音 platform button
    const platformBtns = screen.getAllByRole('button').filter(
      (b) => b.textContent?.includes('抖音') && !b.textContent?.includes('副'),
    );
    if (platformBtns[0]) fireEvent.click(platformBtns[0]);
    expect(screen.getByText('生成账号包装方案').closest('button')).not.toBeDisabled();
  });

  // ── AC-5: canBulkActions hardcoded false ──────────────────────────────────

  it('toolbar bulk action buttons are disabled (canBulkActions=false)', () => {
    renderStep3();
    expect(screen.getByRole('button', { name: /智能优化/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /一键重新生成/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /复制全部/ })).toBeDisabled();
  });
});
