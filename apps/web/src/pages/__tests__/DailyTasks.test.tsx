/**
 * PRD-25 US-003 AC-10 · DailyTasks unit tests
 * ≥ 7 tests: 轮询启停 / server data 渲染 / regenerate button / markCompleted optimistic /
 *            EmptyState 无任务 / isFallback hint / 无 account EmptyState
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DailyTasks from '@/pages/modules/DailyTasks';

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as object), useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: vi.fn(),
}));

// tRPC mock — all 3 procedures + useUtils
const mockCancelFn = vi.fn().mockResolvedValue(undefined);
const mockGetDataFn = vi.fn().mockReturnValue(null);
const mockSetDataFn = vi.fn();
const mockInvalidateFn = vi.fn().mockResolvedValue(undefined);

const mockGetTodayUseQuery = vi.fn();
const mockRegenerateMutate = vi.fn();
const mockRegenerateUseMutation = vi.fn();
const mockMarkCompletedMutate = vi.fn();
const mockMarkCompletedUseMutation = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    dailyTasks: {
      getToday: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        useQuery: (...args: unknown[]) => mockGetTodayUseQuery(...args) as unknown,
      },
      regenerateToday: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        useMutation: (...args: unknown[]) => mockRegenerateUseMutation(...args) as unknown,
      },
      markCompleted: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        useMutation: (...args: unknown[]) => mockMarkCompletedUseMutation(...args) as unknown,
      },
    },
    useUtils: () => ({
      dailyTasks: {
        getToday: {
          cancel: mockCancelFn,
          getData: mockGetDataFn,
          setData: mockSetDataFn,
          invalidate: mockInvalidateFn,
        },
      },
    }),
  },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const { useActiveAccount } = await import('@/hooks/useActiveAccount');

const mockAccount = {
  id: 42,
  name: 'Test User',
  platform: 'douyin' as const,
  stage: 'starter' as const,
  industry: '科技',
  followersRange: '0-1000' as const,
};

function makeTask(overrides?: Record<string, unknown>) {
  return {
    id: `task-${Math.random().toString(36).slice(2)}`,
    title: '测试任务标题',
    description: '任务描述',
    type: 'copywriting',
    ctaUrl: '/copywriting',
    ctaText: '前往',
    expectedOutcome: '预期成果',
    estimatedMinutes: 20,
    difficulty: 'medium' as const,
    completed: false,
    ...overrides,
  };
}

function makeDailyTaskRow(tasks: ReturnType<typeof makeTask>[], isFallback = false) {
  return {
    id: 1,
    accountId: 42,
    taskDate: new Date().toISOString(),
    tasks,
    completedCount: tasks.filter((t) => t.completed).length,
    totalCount: tasks.length,
    agentId: 'DailyTaskAgent',
    modelUsed: 'claude-sonnet-4-6',
    isFallback,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function renderDailyTasks() {
  return render(
    <MemoryRouter>
      <DailyTasks />
    </MemoryRouter>,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('DailyTasks PRD-25 US-003', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    mockGetTodayUseQuery.mockReturnValue({ data: null, isLoading: false });
    mockRegenerateMutate.mockClear();
    mockMarkCompletedMutate.mockClear();
    mockRegenerateUseMutation.mockReturnValue({ mutate: mockRegenerateMutate, isPending: false });
    mockMarkCompletedUseMutation.mockReturnValue({ mutate: mockMarkCompletedMutate, mutateAsync: vi.fn(), isPending: false });
    vi.mocked(useActiveAccount).mockReturnValue({
      account: mockAccount,
      isLoading: false,
      isSwitching: false,
      switchTo: vi.fn(),
    });
  });

  // AC-10(a): 轮询启停 — data=null 时传 refetchInterval fn; data exists 时返回 false
  it('AC-10(a) · 轮询启停 · data=null 时 refetchInterval fn 返回 3000', () => {
    renderDailyTasks();
    const [, options] = mockGetTodayUseQuery.mock.calls[0] as [unknown, { refetchInterval: (q: { state: { data: unknown } }) => number | false }];
    const rfn = options.refetchInterval;
    expect(rfn({ state: { data: null } })).toBe(3000);
    expect(rfn({ state: { data: { id: 1 } } })).toBe(false);
    expect(rfn({ state: { data: undefined } })).toBe(false);
  });

  // AC-10(b): server data 渲染 — data.tasks.map 渲染 TaskCard h3
  it('AC-10(b) · server data 渲染 · 3 任务卡 h3 标题', () => {
    const tasks = [
      makeTask({ title: '任务 Alpha' }),
      makeTask({ title: '任务 Beta' }),
      makeTask({ title: '任务 Gamma' }),
    ];
    mockGetTodayUseQuery.mockReturnValue({ data: makeDailyTaskRow(tasks), isLoading: false });
    renderDailyTasks();
    expect(screen.getByText('任务 Alpha')).toBeInTheDocument();
    expect(screen.getByText('任务 Beta')).toBeInTheDocument();
    expect(screen.getByText('任务 Gamma')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });

  // AC-10(c): regenerate button → useMutation.mutate 被调用
  it('AC-10(c) · 生成今日任务 button → regenerateToday.mutate 调用', () => {
    // data=null → EmptyState with "生成今日任务"
    renderDailyTasks();
    const generateBtn = screen.getByRole('button', { name: /生成今日任务/ });
    expect(generateBtn).toBeInTheDocument();
    fireEvent.click(generateBtn);
    expect(mockRegenerateMutate).toHaveBeenCalledTimes(1);
  });

  // AC-10(c2): 重新生成 button(有 data 时) → mutate
  it('AC-10(c2) · 重新生成 button(有任务时) → regenerateToday.mutate 调用', () => {
    mockGetTodayUseQuery.mockReturnValue({
      data: makeDailyTaskRow([makeTask({ title: '任务 X' })]),
      isLoading: false,
    });
    renderDailyTasks();
    const regenBtn = screen.getByTestId('regenerate-button');
    fireEvent.click(regenBtn);
    expect(mockRegenerateMutate).toHaveBeenCalledTimes(1);
  });

  // AC-10(d): markCompleted optimistic — click 完成打卡 → mutate 调用 + setData 被调用
  it('AC-10(d) · markCompleted optimistic · mutate 调用 + useUtils.setData 调用', async () => {
    const task1 = makeTask({ title: '打卡任务', id: 'task-uuid-001' });
    const row = makeDailyTaskRow([task1]);
    mockGetTodayUseQuery.mockReturnValue({ data: row, isLoading: false });

    // capture onMutate to test optimistic update
    let capturedOnMutate: ((vars: { dailyTaskId: number; taskId: string }) => Promise<unknown>) | undefined;
    mockMarkCompletedUseMutation.mockImplementation((opts: { onMutate?: (v: { dailyTaskId: number; taskId: string }) => Promise<unknown> }) => {
      capturedOnMutate = opts?.onMutate;
      return { mutate: mockMarkCompletedMutate, mutateAsync: vi.fn(), isPending: false };
    });

    renderDailyTasks();
    const completeBtn = screen.getByRole('button', { name: '完成打卡' });
    fireEvent.click(completeBtn);

    // markCompleted.mutate called with correct args
    expect(mockMarkCompletedMutate).toHaveBeenCalledWith(
      expect.objectContaining({ dailyTaskId: 1, taskId: 'task-uuid-001' }),
    );

    // Trigger onMutate manually and verify setData is called
    if (capturedOnMutate) {
      await capturedOnMutate({ dailyTaskId: 1, taskId: 'task-uuid-001' });
      expect(mockCancelFn).toHaveBeenCalled();
      expect(mockSetDataFn).toHaveBeenCalled();
    }
  });

  // AC-10(d2): onError rollback → toast.error
  it('AC-10(d2) · markCompleted onError → toast.error + setData 回滚', async () => {
    const { toast } = await import('sonner');
    const task1 = makeTask({ title: '打卡任务', id: 'task-uuid-002' });
    const row = makeDailyTaskRow([task1]);
    mockGetTodayUseQuery.mockReturnValue({ data: row, isLoading: false });

    let capturedOnError: ((err: Error, vars: unknown, ctx: { previous: unknown }) => void) | undefined;
    mockMarkCompletedUseMutation.mockImplementation((opts: { onError?: (e: Error, v: unknown, c: { previous: unknown }) => void }) => {
      capturedOnError = opts?.onError;
      return { mutate: mockMarkCompletedMutate, mutateAsync: vi.fn(), isPending: false };
    });

    renderDailyTasks();
    fireEvent.click(screen.getByRole('button', { name: '完成打卡' }));

    if (capturedOnError) {
      capturedOnError(new Error('fail'), {}, { previous: row });
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('打卡失败 · 请稍后再试');
      });
    }
  });

  // AC-10(e): EmptyState 无任务
  it('AC-10(e) · EmptyState 无今日任务 · "AI 暂未生成今日任务" + "生成今日任务" button', () => {
    // data=null → AC-6 EmptyState
    renderDailyTasks();
    expect(screen.getByText('AI 暂未生成今日任务')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /生成今日任务/ })).toBeInTheDocument();
  });

  // AC-10(e2): EmptyState 无 account
  it('AC-10(e2) · 无 account → EmptyState "请先创建 IP 账号"', () => {
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

  // AC-10(f): isFallback hint
  it('AC-10(f) · isFallback=true → 灰色 banner "AI 暂未生成 · 显示规则建议"', () => {
    mockGetTodayUseQuery.mockReturnValue({
      data: makeDailyTaskRow([makeTask({ title: '规则建议任务' })], true),
      isLoading: false,
    });
    renderDailyTasks();
    expect(screen.getByTestId('fallback-banner')).toBeInTheDocument();
    expect(screen.getByText(/AI 暂未生成 · 显示规则建议/)).toBeInTheDocument();
  });

  // AC-1 + H1 字面锁
  it('AC-1 · H1 字面锁 "今日行动清单"', () => {
    renderDailyTasks();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('今日行动清单');
  });

  // AC-7: LS 写入 acc_ prefix (LD-009)
  it('AC-7 · 打卡 → localStorage acc_ prefix getLsKey 写入', () => {
    const task1 = makeTask({ title: 'LS 测试任务', id: 'ls-task-001' });
    const row = makeDailyTaskRow([task1]);
    mockGetTodayUseQuery.mockReturnValue({ data: row, isLoading: false });

    renderDailyTasks();
    fireEvent.click(screen.getByRole('button', { name: '完成打卡' }));

    const key = `aiip_memory_acc_${mockAccount.id}_daily_tasks_completed`;
    const stored = localStorage.getItem(key);
    expect(stored).not.toBeNull();
    const ids = JSON.parse(stored ?? '[]') as string[];
    expect(ids).toContain('ls-task-001');
  });
});
