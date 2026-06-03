/**
 * /daily-tasks · 今日行动清单 · 阶段2 接真 tRPC 验收
 * mock trpc.dailyTasks.getToday/getHistory/markCompleted/regenerateToday
 * 断言: 真任务卡渲染、进度环真 pct、stats 真算、markCompleted 调用、空态/loading/error
 * 保留所有原 testid + 字面锁
 *
 * P13: 使用 vi.useFakeTimers + vi.setSystemTime 固定系统时间，
 *       避免 calcStats streak 随日历日期漂移导致 CI 随机绿/红。
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DailyTasks from '@/pages/modules/DailyTasks';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as object), useNavigate: () => mockNavigate };
});

// ── Real-shape backend task items ──────────────────────────────────────────────

const BACKEND_TASKS = [
  {
    id: 'aaaaaaaa-0001-4aaa-8aaa-aaaaaaaaaaaa',
    type: 'copywriting',
    title: '复盘已发布内容数据并总结',
    description: '登录后台查看上周核心数据',
    difficulty: 'hard' as const,
    estimatedMinutes: 30,
    ctaText: '去完成',
    ctaUrl: '/copywriting',
    completed: false,
    expectedOutcome: '数据汇总表格',
  },
  {
    id: 'aaaaaaaa-0002-4aaa-8aaa-aaaaaaaaaaaa',
    type: 'analysis',
    title: '优化下一批内容选题和脚本方向',
    description: '根据数据复盘结果调整选题',
    difficulty: 'hard' as const,
    estimatedMinutes: 45,
    ctaText: '去完成',
    ctaUrl: '/analysis',
    completed: false,
    expectedOutcome: '选题优化方案',
  },
  {
    id: 'aaaaaaaa-0003-4aaa-8aaa-aaaaaaaaaaaa',
    type: 'knowledge',
    title: '研究对标账号的评论区互动策略',
    description: '选择3-5个对标账号观察评论区',
    difficulty: 'medium' as const,
    estimatedMinutes: 20,
    ctaText: '去完成',
    ctaUrl: '/knowledge',
    completed: false,
    expectedOutcome: '互动策略笔记',
  },
  {
    id: 'aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa',
    type: 'trending',
    title: '进行一次口播训练并录制',
    description: '至少3次训练并回放检查',
    difficulty: 'hard' as const,
    estimatedMinutes: 40,
    ctaText: '去完成',
    ctaUrl: '/trending',
    completed: true,
    expectedOutcome: '录制视频片段',
  },
];

// Pinned to 2026-06-02 (fake-timer date in tests) so taskDate aligns with streak logic
const TODAY_RECORD = {
  id: 101,
  accountId: 1,
  taskDate: new Date('2026-06-02T00:00:00.000Z'),
  tasks: BACKEND_TASKS,
  completedCount: 1,
  totalCount: 4,
  agentId: 'DailyTaskAgent',
  modelUsed: 'claude-sonnet-4-6',
  isFallback: false,
  createdAt: new Date('2026-06-02T06:00:00.000Z'),
  updatedAt: new Date('2026-06-02T06:00:00.000Z'),
};

// 3 consecutive days ending on 2026-06-02 → streak = 3
const HISTORY_ROWS = [
  { id: 99,  accountId: 1, taskDate: new Date('2026-05-31T00:00:00.000Z'), tasks: [], completedCount: 3, totalCount: 4, agentId: 'DailyTaskAgent', modelUsed: 'claude-sonnet-4-6', isFallback: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 100, accountId: 1, taskDate: new Date('2026-06-01T00:00:00.000Z'), tasks: [], completedCount: 4, totalCount: 4, agentId: 'DailyTaskAgent', modelUsed: 'claude-sonnet-4-6', isFallback: false, createdAt: new Date(), updatedAt: new Date() },
  { id: 101, accountId: 1, taskDate: new Date('2026-06-02T00:00:00.000Z'), tasks: BACKEND_TASKS, completedCount: 1, totalCount: 4, agentId: 'DailyTaskAgent', modelUsed: 'claude-sonnet-4-6', isFallback: false, createdAt: new Date(), updatedAt: new Date() },
];

// ── Mutable mock state ─────────────────────────────────────────────────────────

interface MockGetTodayState {
  data: typeof TODAY_RECORD | null | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

let mockGetToday: MockGetTodayState = {
  data: TODAY_RECORD,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

let mockGetHistory: {
  data: typeof HISTORY_ROWS;
  isError: boolean;
  isLoading: boolean;
} = { data: HISTORY_ROWS, isError: false, isLoading: false };

const mockMarkCompletedMutate = vi.fn();
const mockRegenerateMutate = vi.fn();
const mockInvalidateToday = vi.fn().mockResolvedValue(undefined);

type MarkCompletedOpts = {
  onMutate?: (vars: { dailyTaskId: number; taskId: string }) => void;
  onSuccess?: () => Promise<void>;
  onError?: (err: Error, vars: { dailyTaskId: number; taskId: string }) => void;
  onSettled?: (_data: unknown, _err: unknown, vars: { dailyTaskId: number; taskId: string }) => void;
};

let markCompletedMode: 'success' | 'error' = 'success';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    dailyTasks: {
      getToday: {
        useQuery: () => mockGetToday,
      },
      getHistory: {
        useQuery: () => mockGetHistory,
      },
      markCompleted: {
        useMutation: vi.fn().mockImplementation((opts: MarkCompletedOpts = {}) => ({
          mutate: (input: { dailyTaskId: number; taskId: string }) => {
            opts.onMutate?.(input);
            mockMarkCompletedMutate(input);
            if (markCompletedMode === 'success') {
              void opts.onSuccess?.();
              opts.onSettled?.(undefined, undefined, input);
            } else {
              opts.onError?.(new Error('network error'), input);
              opts.onSettled?.(undefined, new Error('network error'), input);
            }
          },
          isPending: false,
        })),
      },
      regenerateToday: {
        useMutation: vi.fn().mockImplementation((opts: { onSuccess?: () => void; onError?: () => void } = {}) => ({
          mutate: () => {
            mockRegenerateMutate();
            opts.onSuccess?.();
          },
          isPending: false,
        })),
      },
    },
    useUtils: () => ({
      dailyTasks: {
        getToday: { invalidate: mockInvalidateToday },
      },
    }),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, login: vi.fn(), logout: vi.fn() }),
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: null,
    isLoading: false,
    isSwitching: false,
    switchTo: vi.fn(),
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderDailyTasks() {
  return render(
    <MemoryRouter>
      <DailyTasks />
    </MemoryRouter>,
  );
}

let toastSuccessSpy: ReturnType<typeof vi.fn>;
let toastErrorSpy: ReturnType<typeof vi.fn>;

// P13: pin system time to 2026-06-02T12:00:00Z in every test so streak/date
//      comparisons are stable across calendar days in CI.
beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime('2026-06-02T12:00:00Z');

  mockGetToday = {
    data: TODAY_RECORD,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
  mockGetHistory = { data: HISTORY_ROWS, isError: false, isLoading: false };
  markCompletedMode = 'success';
  mockMarkCompletedMutate.mockClear();
  mockRegenerateMutate.mockClear();
  mockInvalidateToday.mockClear();
  mockNavigate.mockClear();

  const sonnerMod = await import('sonner');
  toastSuccessSpy = vi.mocked(sonnerMod.toast.success);
  toastErrorSpy = vi.mocked(sonnerMod.toast.error);
  toastSuccessSpy.mockClear();
  toastErrorSpy.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ── Tests: 字面锁 ──────────────────────────────────────────────────────────────

describe('DailyTasks · 字面锁 (chip / h1 / subtitle)', () => {
  it('chip / h1 / subtitle 字面锁', () => {
    renderDailyTasks();
    expect(screen.getByTestId('daily-tasks-chip')).toHaveTextContent('每日任务');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('今日行动清单');
    expect(screen.getByText('每天完成具体任务，一步步打造变现IP')).toBeInTheDocument();
  });

  it('3 stat label 字面锁 (连续打卡天数 / 累计打卡天数 / 累计完成任务)', () => {
    renderDailyTasks();
    expect(screen.getAllByText('连续打卡天数').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('累计打卡天数').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('累计完成任务').length).toBeGreaterThanOrEqual(1);
  });

  it('footer 2 button 字面锁 + click navigate', () => {
    renderDailyTasks();
    expect(screen.getByTestId('footer-btn-diagnosis')).toHaveTextContent('IP诊断');
    expect(screen.getByTestId('footer-btn-continue')).toHaveTextContent('继续做IP方案');

    fireEvent.click(screen.getByTestId('footer-btn-diagnosis'));
    expect(mockNavigate).toHaveBeenCalledWith('/diagnosis');

    fireEvent.click(screen.getByTestId('footer-btn-continue'));
    expect(mockNavigate).toHaveBeenCalledWith('/step/1');
  });
});

// ── Tests: 真任务卡渲染 ────────────────────────────────────────────────────────

describe('DailyTasks · 真任务卡渲染', () => {
  it('4 真任务卡 data-testid 渲染', () => {
    renderDailyTasks();
    expect(screen.getByTestId(`task-card-${BACKEND_TASKS[0]!.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`task-card-${BACKEND_TASKS[1]!.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`task-card-${BACKEND_TASKS[2]!.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`task-card-${BACKEND_TASKS[3]!.id}`)).toBeInTheDocument();
  });

  it('任务标题真渲染', () => {
    renderDailyTasks();
    expect(screen.getByText('复盘已发布内容数据并总结')).toBeInTheDocument();
    expect(screen.getByText('优化下一批内容选题和脚本方向')).toBeInTheDocument();
    expect(screen.getByText('研究对标账号的评论区互动策略')).toBeInTheDocument();
    expect(screen.getByText('进行一次口播训练并录制')).toBeInTheDocument();
  });

  it('difficulty→priority 映射: hard→高优先, medium→中优先', () => {
    renderDailyTasks();
    const tags = screen.getAllByTestId('task-priority-tag');
    const texts = tags.map((t) => t.textContent ?? '');
    expect(texts.filter((t) => t.includes('高优先')).length).toBeGreaterThanOrEqual(3); // 3 hard tasks
    expect(texts.filter((t) => t.includes('中优先')).length).toBeGreaterThanOrEqual(1); // 1 medium task
  });

  it('type→category 映射: copywriting→内容创作, analysis/diagnosis→账号优化, knowledge/trending→学习研究', () => {
    renderDailyTasks();
    const catTags = screen.getAllByTestId('task-category-tag');
    const texts = catTags.map((t) => t.textContent ?? '');
    expect(texts.some((t) => t.includes('内容创作'))).toBe(true);
    expect(texts.some((t) => t.includes('账号优化'))).toBe(true);
    expect(texts.some((t) => t.includes('学习研究'))).toBe(true);
  });

  it('完成的任务(task-4 completed=true)显示 check_circle', () => {
    renderDailyTasks();
    const card = screen.getByTestId(`task-card-${BACKEND_TASKS[3]!.id}`);
    // completed button should be disabled
    const btn = card.querySelector('button');
    expect(btn).toBeDisabled();
  });
});

// ── Tests: 进度环真数据 ────────────────────────────────────────────────────────

describe('DailyTasks · 进度环真 pct', () => {
  it('today-progress-card 渲染 + 完成 1 / 4 项任务', () => {
    renderDailyTasks();
    expect(screen.getByTestId('today-progress-card')).toBeInTheDocument();
    expect(screen.getByText('今日进度')).toBeInTheDocument();
    // completedCount=1 (task-4 completed=true), totalCount=4
    expect(screen.getByText(/完成 1 \/ 4 项任务/)).toBeInTheDocument();
  });
});

// ── Tests: stats 真算 ──────────────────────────────────────────────────────────

describe('DailyTasks · stats 真算', () => {
  it('stat-card 3 张渲染', () => {
    renderDailyTasks();
    const cards = screen.getAllByTestId('stat-card');
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  // P7: totalDays = days with completedCount>0; all 3 HISTORY_ROWS have >0 → still 3
  it('累计打卡天数 = history rows with completedCount>0 = 3', () => {
    renderDailyTasks();
    const cards = screen.getAllByTestId('stat-card');
    const dayCard = cards[1]!; // index 1 = total-days
    expect(dayCard).toHaveTextContent('3');
  });

  it('累计完成任务 = Σ completedCount = 3+4+1 = 8', () => {
    renderDailyTasks();
    const cards = screen.getAllByTestId('stat-card');
    const taskCard = cards[2]!; // index 2 = total-tasks
    expect(taskCard).toHaveTextContent('8');
  });

  // P13: streak value assertion (pinned date = 2026-06-02, 3 consecutive days)
  it('连续打卡天数 = 3 (2026-05-31 → 2026-06-01 → 2026-06-02, 系统时间已固定)', () => {
    renderDailyTasks();
    const cards = screen.getAllByTestId('stat-card');
    const streakCard = cards[0]!; // index 0 = streak
    expect(streakCard).toHaveTextContent('3');
  });

  // P13 boundary: today has no record → streak = 0
  it('streak 边界: 今天无记录 → streak = 0', () => {
    // history only has records for 05-31 and 06-01 (not today 06-02)
    mockGetHistory = {
      data: [
        { id: 99,  accountId: 1, taskDate: new Date('2026-05-31T00:00:00.000Z'), tasks: [], completedCount: 3, totalCount: 4, agentId: 'DailyTaskAgent', modelUsed: 'claude-sonnet-4-6', isFallback: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 100, accountId: 1, taskDate: new Date('2026-06-01T00:00:00.000Z'), tasks: [], completedCount: 4, totalCount: 4, agentId: 'DailyTaskAgent', modelUsed: 'claude-sonnet-4-6', isFallback: false, createdAt: new Date(), updatedAt: new Date() },
      ],
      isError: false,
      isLoading: false,
    };
    renderDailyTasks();
    const cards = screen.getAllByTestId('stat-card');
    const streakCard = cards[0]!;
    // Sorted desc: 06-01 is first → expected today key (06-02) ≠ 06-01 → streak = 0
    expect(streakCard).toHaveTextContent('0');
  });

  // P13 boundary: gap in streak → streak breaks
  it('streak 边界: 有断层 → streak 不累加缺失日', () => {
    // 06-02 today + 05-31 (gap on 06-01) → streak = 1 (only today)
    mockGetHistory = {
      data: [
        { id: 99,  accountId: 1, taskDate: new Date('2026-05-31T00:00:00.000Z'), tasks: [], completedCount: 3, totalCount: 4, agentId: 'DailyTaskAgent', modelUsed: 'claude-sonnet-4-6', isFallback: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 101, accountId: 1, taskDate: new Date('2026-06-02T00:00:00.000Z'), tasks: [], completedCount: 1, totalCount: 4, agentId: 'DailyTaskAgent', modelUsed: 'claude-sonnet-4-6', isFallback: false, createdAt: new Date(), updatedAt: new Date() },
      ],
      isError: false,
      isLoading: false,
    };
    renderDailyTasks();
    const cards = screen.getAllByTestId('stat-card');
    const streakCard = cards[0]!;
    // Sorted desc: 06-02 matches today → streak++; next expected 06-01 but row is 05-31 → break
    expect(streakCard).toHaveTextContent('1');
  });

  // P2: history error → stats show "—"
  it('getHistory 错误 → stat 卡显示 "—" 而非假数字', () => {
    mockGetHistory = { data: [], isError: true, isLoading: false };
    renderDailyTasks();
    // All 3 stat cards should show "—"
    const cards = screen.getAllByTestId('stat-card');
    expect(cards[0]).toHaveTextContent('—');
    expect(cards[1]).toHaveTextContent('—');
    expect(cards[2]).toHaveTextContent('—');
  });

  // P3: 近30天 disclaimer on totalDays/totalTasks
  it('stats 区有 "近 30 天" 说明文案', () => {
    renderDailyTasks();
    const all30 = screen.getAllByText('近 30 天');
    expect(all30.length).toBeGreaterThanOrEqual(2); // totalDays + totalTasks cards
  });
});

// ── Tests: markCompleted 调用 ──────────────────────────────────────────────────

describe('DailyTasks · markCompleted mutation', () => {
  it('点击未完成任务的完成按钮 → markCompleted.mutate 调用 with dailyTaskId + taskId', async () => {
    renderDailyTasks();
    const card = screen.getByTestId(`task-card-${BACKEND_TASKS[0]!.id}`);
    const btn = card.querySelector('button');
    expect(btn).not.toBeNull();
    await act(async () => {
      fireEvent.click(btn!);
      await vi.runAllTimersAsync();
    });
    expect(mockMarkCompletedMutate).toHaveBeenCalledWith({
      dailyTaskId: 101,
      taskId: BACKEND_TASKS[0]!.id,
    });
    expect(mockInvalidateToday).toHaveBeenCalled();
  });

  it('markCompleted 失败 → toast.error + 乐观回滚', async () => {
    markCompletedMode = 'error';
    renderDailyTasks();
    const card = screen.getByTestId(`task-card-${BACKEND_TASKS[0]!.id}`);
    const btn = card.querySelector('button');
    await act(async () => {
      fireEvent.click(btn!);
      await vi.runAllTimersAsync();
    });
    expect(toastErrorSpy).toHaveBeenCalledWith('标记失败，请重试');
  });

  it('已完成的任务按钮 disabled, 不可再点', () => {
    renderDailyTasks();
    const card = screen.getByTestId(`task-card-${BACKEND_TASKS[3]!.id}`);
    const btn = card.querySelector('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn!);
    expect(mockMarkCompletedMutate).not.toHaveBeenCalled();
  });
});

// ── Tests: 重新生成 ────────────────────────────────────────────────────────────

describe('DailyTasks · regenerateToday', () => {
  it('点击重新生成 → regenerateToday.mutate 调用 → toast.success', async () => {
    renderDailyTasks();
    const regenBtn = screen.getByTestId('daily-tasks-regenerate');
    await act(async () => {
      fireEvent.click(regenBtn);
      await vi.runAllTimersAsync();
    });
    expect(mockRegenerateMutate).toHaveBeenCalled();
    // P9: toast.success is called with the message + action object
    expect(toastSuccessSpy).toHaveBeenCalledWith(
      '已加入生成队列，稍后刷新查看',
      expect.objectContaining({ action: expect.objectContaining({ label: '刷新' }) }),
    );
  });
});

// ── Tests: 空态 (getToday null) ────────────────────────────────────────────────

describe('DailyTasks · 空态', () => {
  it('getToday null → daily-tasks-empty 渲染 + 今日暂无任务', () => {
    mockGetToday = { data: null, isLoading: false, isError: false, refetch: vi.fn() };
    renderDailyTasks();
    expect(screen.getByTestId('daily-tasks-empty')).toBeInTheDocument();
    expect(screen.getByText('今日暂无任务')).toBeInTheDocument();
  });

  it('空态有重新生成按钮 + footer', () => {
    mockGetToday = { data: null, isLoading: false, isError: false, refetch: vi.fn() };
    renderDailyTasks();
    expect(screen.getByTestId('daily-tasks-regenerate')).toBeInTheDocument();
    expect(screen.getByTestId('footer-btn-diagnosis')).toBeInTheDocument();
    expect(screen.getByTestId('footer-btn-continue')).toBeInTheDocument();
  });

  it('空态点重新生成 → regenerateToday.mutate 调用 → toast.success', async () => {
    mockGetToday = { data: null, isLoading: false, isError: false, refetch: vi.fn() };
    renderDailyTasks();
    const btn = screen.getByTestId('daily-tasks-regenerate');
    await act(async () => {
      fireEvent.click(btn);
      await vi.runAllTimersAsync();
    });
    expect(mockRegenerateMutate).toHaveBeenCalled();
    expect(toastSuccessSpy).toHaveBeenCalledWith(
      '已加入生成队列，稍后刷新查看',
      expect.objectContaining({ action: expect.objectContaining({ label: '刷新' }) }),
    );
  });
});

// ── Tests: 加载态 ──────────────────────────────────────────────────────────────

describe('DailyTasks · 加载态', () => {
  it('isLoading=true → daily-tasks-loading 骨架出现', () => {
    mockGetToday = { data: undefined, isLoading: true, isError: false, refetch: vi.fn() };
    renderDailyTasks();
    expect(screen.getByTestId('daily-tasks-loading')).toBeInTheDocument();
  });
});

// ── Tests: 错误态 ──────────────────────────────────────────────────────────────

describe('DailyTasks · 错误态', () => {
  it('isError=true → daily-tasks-error + daily-tasks-retry 渲染', () => {
    mockGetToday = { data: undefined, isLoading: false, isError: true, refetch: vi.fn() };
    renderDailyTasks();
    expect(screen.getByTestId('daily-tasks-error')).toBeInTheDocument();
    expect(screen.getByTestId('daily-tasks-retry')).toBeInTheDocument();
  });

  it('重试按钮点击 → refetch 被调用', async () => {
    const mockRefetch = vi.fn();
    mockGetToday = { data: undefined, isLoading: false, isError: true, refetch: mockRefetch };
    renderDailyTasks();
    await act(async () => {
      fireEvent.click(screen.getByTestId('daily-tasks-retry'));
    });
    expect(mockRefetch).toHaveBeenCalled();
  });
});

// ── Tests: isFallback 提示 ──────────────────────────────────────────────────────

describe('DailyTasks · isFallback', () => {
  it('isFallback=true → 降级提示文字出现', () => {
    mockGetToday = {
      data: { ...TODAY_RECORD, isFallback: true },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
    renderDailyTasks();
    expect(screen.getByText(/当前为降级数据/)).toBeInTheDocument();
  });
});

// ── Tests: P1 雷达诚实性 ───────────────────────────────────────────────────────

describe('DailyTasks · 雷达诚实性 (P1)', () => {
  it('不显示「模型已就绪」徽章', () => {
    renderDailyTasks();
    expect(screen.queryByText('模型已就绪')).not.toBeInTheDocument();
  });

  it('header label 改为「参考基准 · 示例」而非「历史数据综合评估」', () => {
    renderDailyTasks();
    expect(screen.queryByText(/历史数据综合评估/)).not.toBeInTheDocument();
    expect(screen.getByText(/参考基准/)).toBeInTheDocument();
  });
});

// ── Tests: P4 runtime guard ────────────────────────────────────────────────────

describe('DailyTasks · runtime guard (P4)', () => {
  it('tasks 字段为 null 时不崩溃', () => {
    mockGetToday = {
      data: { ...TODAY_RECORD, tasks: null as unknown as typeof BACKEND_TASKS },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
    // should render without throwing
    expect(() => renderDailyTasks()).not.toThrow();
    // falls back to mock tasks when real tasks array is invalid
    expect(screen.getByTestId('daily-tasks-chip')).toBeInTheDocument();
  });
});
