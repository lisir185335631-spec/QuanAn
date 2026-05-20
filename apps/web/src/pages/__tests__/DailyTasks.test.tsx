/**
 * PRD-24 US-001 · DailyTasks unit tests (D-233 AC-8)
 * ≥ 6 tests: H1字面 / stub任务渲染 / 完成click / 空态 / loading state / localStorage save
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import DailyTasks from '@/pages/modules/DailyTasks';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock useActiveAccount as a configurable vi.fn()
vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: vi.fn(),
}));

const mockAccountData = {
  id: 42,
  name: 'Test User',
  platform: 'douyin' as const,
  stage: 'starter' as const,
  industry: '科技',
  followersRange: '0-1000' as const,
};

function renderDailyTasks() {
  return render(
    <MemoryRouter>
      <DailyTasks />
    </MemoryRouter>,
  );
}

describe('DailyTasks page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    mockNavigate.mockClear();
    // Default: has account
    vi.mocked(useActiveAccount).mockReturnValue({
      account: mockAccountData,
      isLoading: false,
      isSwitching: false,
      switchTo: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC-1 · H1 字面锁 "今日行动清单"', () => {
    renderDailyTasks();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('今日行动清单');
  });

  it('AC-3 · stub 3 H3 任务卡渲染(DAILY_TASKS_STUB 字面对照)', () => {
    renderDailyTasks();
    act(() => { vi.advanceTimersByTime(1000); });
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/今天发布 1 条 step\/7 生成的文案/)).toBeInTheDocument();
    expect(screen.getByText(/优化 step\/3 的简介/)).toBeInTheDocument();
    expect(screen.getByText(/回复粉丝评论 X 条/)).toBeInTheDocument();
  });

  it('AC-3 · 完成 button click → toast.success', async () => {
    const { toast } = await import('sonner');
    renderDailyTasks();
    act(() => { vi.advanceTimersByTime(1000); });
    const completeButtons = screen.getAllByRole('button', { name: '完成打卡' });
    expect(completeButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(completeButtons[0]!);
    expect(toast.success).toHaveBeenCalledWith('打卡功能 PRD-25+');
  });

  it('AC-4 · 无 active account → EmptyState + "添加账号" CTA', () => {
    vi.mocked(useActiveAccount).mockReturnValue({
      account: null,
      isLoading: false,
      isSwitching: false,
      switchTo: vi.fn(),
    });
    renderDailyTasks();
    expect(screen.getByText('请先创建 IP 账号')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '添加账号' })).toBeInTheDocument();
  });

  it('AC-5 · loading state → spinner + DAILY_TASKS_LOADING_TEXT', () => {
    renderDailyTasks();
    // Initial render with account set → loading state (before 800ms timer)
    expect(screen.getByText('AI 老师正在为你制定今日任务...')).toBeInTheDocument();
  });

  it('AC-6 · 打卡 → localStorage 用 getLsKey(acc_ 前缀) 写入 completed ids', () => {
    renderDailyTasks();
    act(() => { vi.advanceTimersByTime(1000); });
    const completeButtons = screen.getAllByRole('button', { name: '完成打卡' });
    fireEvent.click(completeButtons[0]!);
    const key = `aiip_memory_acc_${mockAccountData.id}_daily_tasks_completed`;
    const stored = JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
    expect(stored).toContain('publish-step7');
  });

  it('AC-4 · 无 account → "添加账号" button click → navigate /accounts', () => {
    vi.mocked(useActiveAccount).mockReturnValue({
      account: null,
      isLoading: false,
      isSwitching: false,
      switchTo: vi.fn(),
    });
    renderDailyTasks();
    fireEvent.click(screen.getByRole('button', { name: '添加账号' }));
    expect(mockNavigate).toHaveBeenCalledWith('/accounts');
  });
});
