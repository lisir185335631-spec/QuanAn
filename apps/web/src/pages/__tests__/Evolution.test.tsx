/**
 * PRD-24 US-002 · Evolution unit tests (D-233 AC-8)
 * ≥ 8 tests: H1 / 5 级 badge / 4 指标 / 5 H3 字面 / 4 进化方向 radio /
 *            radio click / localStorage save / spec §8.5.3 字面对照
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import Evolution from '@/pages/modules/Evolution';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: vi.fn(),
}));

const mockAccount = {
  id: 42,
  name: 'Test',
  platform: 'douyin' as const,
  stage: 'starter' as const,
  industry: '科技',
  followersRange: '0-1000' as const,
};

function renderEvolution() {
  return render(
    <MemoryRouter>
      <Evolution />
    </MemoryRouter>,
  );
}

describe('Evolution page · PRD-24 US-002', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    vi.mocked(useActiveAccount).mockReturnValue({
      account: mockAccount,
      isLoading: false,
      isSwitching: false,
      switchTo: vi.fn(),
    });
  });

  it('AC-1 · H1 字面锁 "智能体进化中心"', () => {
    renderEvolution();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('智能体进化中心');
  });

  it('AC-1 · spec §8.5.3 副标字面对照', () => {
    renderEvolution();
    expect(
      screen.getByText('你的智能体通过反馈学习和深度学习持续进化，越用越懂你'),
    ).toBeInTheDocument();
  });

  it('AC-1 · "智能" 菜单分类标识可见', () => {
    renderEvolution();
    const label = screen.getByText('智能');
    expect(label).toBeInTheDocument();
  });

  it('AC-5 · 5 级 badge 全部渲染(L1/L2/L3/L4/L5)', () => {
    renderEvolution();
    expect(screen.getByTestId('badge-L1')).toBeInTheDocument();
    expect(screen.getByTestId('badge-L2')).toBeInTheDocument();
    expect(screen.getByTestId('badge-L3')).toBeInTheDocument();
    expect(screen.getByTestId('badge-L4')).toBeInTheDocument();
    expect(screen.getByTestId('badge-L5')).toBeInTheDocument();
  });

  it('AC-5 · stub L2 active 高亮 · 4 指标卡全部渲染', () => {
    renderEvolution();
    expect(screen.getByTestId('metric-好评数')).toBeInTheDocument();
    expect(screen.getByTestId('metric-待改进')).toBeInTheDocument();
    expect(screen.getByTestId('metric-学习档案')).toBeInTheDocument();
    expect(screen.getByTestId('metric-满意率')).toBeInTheDocument();
  });

  it('AC-3 · 5 H3 模块字面锁全部渲染', () => {
    renderEvolution();
    const h3s = screen.getAllByRole('heading', { level: 3 });
    const texts = h3s.map((h) => h.textContent ?? '');
    expect(texts).toContain('进化等级');
    expect(texts).toContain('进化洞察');
    expect(texts).toContain('最近反馈');
    expect(texts).toContain('深度学习档案');
    expect(texts).toContain('进化设置');
  });

  it('AC-4 · EVOLUTION_DIRECTIONS_4 · 4 进化方向 radio 全部渲染', () => {
    renderEvolution();
    expect(screen.getByTestId('direction-综合优化（积累反馈后自动生成）')).toBeInTheDocument();
    expect(screen.getByTestId('direction-创意性优先')).toBeInTheDocument();
    expect(screen.getByTestId('direction-转化率优先')).toBeInTheDocument();
    expect(screen.getByTestId('direction-真实感优先')).toBeInTheDocument();
  });

  it('AC-6 · radio click → localStorage acc_{accountId}_evolution_settings 写入', () => {
    renderEvolution();
    const btn = screen.getByTestId('direction-创意性优先');
    fireEvent.click(btn);
    const key = `aiip_memory_acc_${mockAccount.id}_evolution_settings`;
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}') as { direction?: string };
    expect(stored.direction).toBe('创意性优先');
  });

  it('AC-6 · 切换 radio → aria-pressed 状态更新', () => {
    renderEvolution();
    const btn = screen.getByTestId('direction-转化率优先');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    // original default should be false now
    expect(screen.getByTestId('direction-综合优化（积累反馈后自动生成）')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('AC-7 · DOM button 数 ≥ 9', () => {
    renderEvolution();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(9);
  });
});
