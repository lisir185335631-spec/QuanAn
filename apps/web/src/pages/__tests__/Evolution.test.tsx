/**
 * Evolution page · legacy test file (was PRD-25 US-004)
 * Updated to sally 1:1 복刻版 · mock-first · 0 backend
 * Redirects to the canonical test at:
 *   apps/web/src/pages/modules/__tests__/Evolution.test.tsx
 *
 * Kept here to avoid orphan; mirrors key checks from canonical test.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Evolution from '@/pages/modules/Evolution';

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

let toastInfoSpy: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  mockNavigate.mockClear();
  const sonnerMod = await import('sonner');
  toastInfoSpy = vi.mocked(sonnerMod.toast.info);
  toastInfoSpy.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── helper ─────────────────────────────────────────────────────────────────────

function renderEvolution() {
  return render(
    <MemoryRouter>
      <Evolution />
    </MemoryRouter>,
  );
}

// ── tests ──────────────────────────────────────────────────────────────────────

describe('Evolution page · PRD-25 US-004', () => {
  it('H1 · 智能体进化中心', () => {
    renderEvolution();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('智能体进化中心');
  });

  it('breadcrumb EVOLUTION 出现', () => {
    renderEvolution();
    expect(screen.getByText('EVOLUTION')).toBeInTheDocument();
  });

  it('进化等级 L1：初始化 字面', () => {
    renderEvolution();
    expect(screen.getByTestId('level-title')).toHaveTextContent('进化等级 L1：初始化');
  });

  it('4 stat label 全部出现', () => {
    renderEvolution();
    expect(screen.getByTestId('stat-label-good')).toHaveTextContent('好评数');
    expect(screen.getByTestId('stat-label-needsImprove')).toHaveTextContent('待改进');
    expect(screen.getByTestId('stat-label-learning')).toHaveTextContent('学习档案');
    expect(screen.getByTestId('stat-label-satisfaction')).toHaveTextContent('满意率');
  });

  it('触发进化 btn click → toast.info 触发进化 · 即将上线', async () => {
    renderEvolution();
    await act(async () => {
      fireEvent.click(screen.getByTestId('trigger-evolution-btn'));
    });
    expect(toastInfoSpy).toHaveBeenCalledWith('触发进化 · 即将上线');
  });

  it('还没有进化洞察 + 还没有反馈记录 empty titles 出现', () => {
    renderEvolution();
    expect(screen.getByTestId('insight-empty-title')).toHaveTextContent('还没有进化洞察');
    expect(screen.getByTestId('feedback-empty-title')).toHaveTextContent('还没有反馈记录');
  });

  it('archive 文案学习 2026/5/25 + 已学习 chip', () => {
    renderEvolution();
    expect(screen.getByTestId('archive-title-archive-1')).toHaveTextContent('文案学习 2026/5/25 (1篇)');
    expect(screen.getByTestId('archive-chip-archive-1')).toHaveTextContent('已学习');
  });

  it('自动进化 toggle default true + click → toast 自动进化已关闭', async () => {
    renderEvolution();
    const toggle = screen.getByTestId('auto-toggle');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toastInfoSpy).toHaveBeenCalledWith('自动进化已关闭');
  });

  it('新增学习 click → navigate /deep-learning', async () => {
    renderEvolution();
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-learning-link'));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/deep-learning');
  });
});
