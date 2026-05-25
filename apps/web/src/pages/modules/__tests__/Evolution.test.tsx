/**
 * Evolution module unit tests · sally 1:1 复刻版
 * mock-first · 6-8 it 块 · 字面验收 + 交互断言
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Evolution from '@/pages/modules/Evolution';

// ── mocks ──────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockToastInfo = vi.fn();

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Grab sonner toast mock after vi.mock
let toastInfoSpy: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  mockNavigate.mockClear();
  mockToastInfo.mockClear();
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

describe('Evolution page · sally 1:1 视觉复刻', () => {
  it('breadcrumb EVOLUTION + 智能体进化中心 出现', () => {
    renderEvolution();
    expect(screen.getByText('EVOLUTION')).toBeInTheDocument();
    // h1 + breadcrumb right both contain 智能体进化中心
    const all = screen.getAllByText('智能体进化中心');
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('subtitle 关键词 反馈学习 / 深度学习 出现', () => {
    renderEvolution();
    expect(screen.getByText('反馈学习')).toBeInTheDocument();
    expect(screen.getByText('深度学习')).toBeInTheDocument();
  });

  it('触发进化 btn click → toast 触发进化 · 即将上线', async () => {
    renderEvolution();
    const btn = screen.getByTestId('trigger-evolution-btn');
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(toastInfoSpy).toHaveBeenCalledWith('触发进化 · 即将上线');
  });

  it('进化等级 L1：初始化 + 已收集 0 条反馈 · 1 个深度学习档案 出现', () => {
    renderEvolution();
    expect(screen.getByTestId('level-title')).toHaveTextContent('进化等级 L1：初始化');
    expect(screen.getByTestId('level-info')).toHaveTextContent(
      '已收集 0 条反馈 · 1 个深度学习档案',
    );
    expect(screen.getByTestId('level-next')).toHaveTextContent(
      '距离下一等级还需 5 条反馈',
    );
  });

  it('4 stat label 出现(好评数 / 待改进 / 学习档案 / 满意率)', () => {
    renderEvolution();
    expect(screen.getByTestId('stat-label-good')).toHaveTextContent('好评数');
    expect(screen.getByTestId('stat-label-needsImprove')).toHaveTextContent('待改进');
    expect(screen.getByTestId('stat-label-learning')).toHaveTextContent('学习档案');
    expect(screen.getByTestId('stat-label-satisfaction')).toHaveTextContent('满意率');
  });

  it('2 empty title 出现(还没有进化洞察 / 还没有反馈记录)', () => {
    renderEvolution();
    expect(screen.getByTestId('insight-empty-title')).toHaveTextContent('还没有进化洞察');
    expect(screen.getByTestId('feedback-empty-title')).toHaveTextContent('还没有反馈记录');
  });

  it('archive 文案学习 2026/5/25 + 已学习 chip 出现', () => {
    renderEvolution();
    expect(
      screen.getByTestId('archive-title-archive-1'),
    ).toHaveTextContent('文案学习 2026/5/25 (1篇)');
    expect(screen.getByTestId('archive-chip-archive-1')).toHaveTextContent('已学习');
  });

  it('自动进化 toggle 切换 + toast', async () => {
    renderEvolution();
    const toggle = screen.getByTestId('auto-toggle');
    // default: autoOn = true → aria-pressed = true
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await act(async () => {
      fireEvent.click(toggle);
    });
    // after click: autoOn = false → toast 自动进化已关闭
    expect(toastInfoSpy).toHaveBeenCalledWith('自动进化已关闭');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('新增学习 link click → navigate /deep-learning', async () => {
    renderEvolution();
    const link = screen.getByTestId('add-learning-link');
    await act(async () => {
      fireEvent.click(link);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/deep-learning');
  });
});
