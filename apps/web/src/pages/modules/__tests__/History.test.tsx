/**
 * History module unit tests · 阶段2 接真 tRPC
 * mock-first · trpc.history.list 给真形状行 · 字面验收 + 交互断言
 * 保留所有 testid 字面锁 · delete 调用断言 · 空态/加载/错误态真断言
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import History from '@/pages/modules/History';

// ── mocks ──────────────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

// Real-shape history rows (numeric id, elements string[], createdAt Date/string)
const MOCK_ROWS = [
  {
    id: 1,
    agentId: 'CopywritingAgent',
    agentMode: null,
    sourceType: 'copywriting',
    inputSummary: '为什么有的人赚钱那么轻松',
    content: '正文内容A',
    contentType: 'markdown',
    scriptType: '搞辩论',
    elements: ['contrast', 'curiosity', 'leverage', 'resonance', 'low_cost_high', 'small_big', 'controversy', 'benefit', 'greed'],
    isFallback: false,
    traceId: null,
    createdAt: new Date('2026-05-24T14:53:07.000Z'),
  },
  {
    id: 2,
    agentId: 'CopywritingAgent',
    agentMode: null,
    sourceType: 'copywriting',
    inputSummary: '为什么有的人赚钱那么轻松',
    content: '正文内容B',
    contentType: 'markdown',
    scriptType: '搞辩论',
    elements: ['contrast', 'curiosity', 'leverage', 'resonance', 'low_cost_high', 'small_big', 'controversy', 'benefit', 'greed'],
    isFallback: false,
    traceId: null,
    createdAt: new Date('2026-04-14T15:33:43.000Z'),
  },
  {
    id: 3,
    agentId: 'CopywritingAgent',
    agentMode: null,
    sourceType: 'copywriting',
    inputSummary: '为什么有的人赚钱那么轻松',
    content: '正文内容C',
    contentType: 'markdown',
    scriptType: '讲故事',
    elements: ['contrast', 'curiosity', 'leverage', 'resonance', 'low_cost_high', 'small_big', 'controversy', 'benefit', 'greed'],
    isFallback: false,
    traceId: null,
    createdAt: new Date('2026-04-14T15:32:19.000Z'),
  },
  {
    id: 4,
    agentId: 'CopywritingAgent',
    agentMode: null,
    sourceType: 'copywriting',
    inputSummary: '为什么有的人赚钱那么轻松',
    content: '正文内容D',
    contentType: 'markdown',
    scriptType: '讲故事',
    elements: ['contrast', 'curiosity', 'leverage', 'resonance', 'low_cost_high', 'small_big', 'controversy', 'benefit', 'greed'],
    isFallback: false,
    traceId: null,
    createdAt: new Date('2026-03-28T09:11:02.000Z'),
  },
];

const mockDeleteMutate = vi.fn();
const mockInvalidate = vi.fn().mockResolvedValue(undefined);

// ── P2 #10: mutable mock state for empty/loading/error tests ──────────────────
interface MockState {
  list: { data: typeof MOCK_ROWS | []; isLoading: boolean; isError: boolean; refetch: () => void };
  count: { data: number };
}

let mockState: MockState = {
  list: { data: MOCK_ROWS, isLoading: false, isError: false, refetch: vi.fn() },
  count: { data: 42 },
};

vi.mock('@/lib/trpc', () => ({
  trpc: {
    history: {
      list: {
        useQuery: () => mockState.list,
      },
      count: {
        useQuery: () => mockState.count,
      },
      delete: {
        useMutation: (opts?: { onSuccess?: () => Promise<void>; onError?: () => void; onMutate?: (v: { id: number }) => void; onSettled?: () => void }) => ({
          mutate: (input: { id: number }) => {
            opts?.onMutate?.(input);
            mockDeleteMutate(input);
            void opts?.onSuccess?.();
          },
          isPending: false,
        }),
      },
    },
    ipAccounts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
    },
    auth: { me: { useQuery: () => ({ data: null, isLoading: false }) } },
    useUtils: () => ({
      history: {
        list: { invalidate: mockInvalidate },
        count: { invalidate: vi.fn().mockResolvedValue(undefined) },
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

// mock clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

let toastSuccessSpy: ReturnType<typeof vi.fn>;
let toastInfoSpy: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  // reset mock state to normal (MOCK_ROWS, not loading, not error)
  mockState = {
    list: { data: MOCK_ROWS, isLoading: false, isError: false, refetch: vi.fn() },
    count: { data: 42 },
  };
  mockWriteText.mockClear();
  mockDeleteMutate.mockClear();
  mockInvalidate.mockClear();
  const sonnerMod = await import('sonner');
  toastSuccessSpy = vi.mocked(sonnerMod.toast.success);
  toastInfoSpy = vi.mocked(sonnerMod.toast.info);
  toastSuccessSpy.mockClear();
  toastInfoSpy.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── helper ─────────────────────────────────────────────────────────────────────

function renderHistory() {
  return render(
    <MemoryRouter>
      <History />
    </MemoryRouter>,
  );
}

// ── tests ──────────────────────────────────────────────────────────────────────

describe('History page · 接真 tRPC 验收', () => {
  it('h1 历史记录 出现', () => {
    renderHistory();
    expect(screen.getByTestId('history-h1')).toHaveTextContent('历史记录');
  });

  it('subtitle 共 4 条 出现 (真行数)', () => {
    renderHistory();
    // P2 #11: precise literal · toHaveTextContent normalizes whitespace so use substring match
    const el = screen.getByTestId('history-subtitle');
    // check all non-space parts are present
    expect(el).toHaveTextContent('查看和管理你生成的所有文案');
    expect(el).toHaveTextContent('共 4 条');
  });

  it('搞辩论 出现 2 次 · 讲故事 出现 2 次', () => {
    renderHistory();
    const allChips = screen.getAllByTestId(/^script-type-chip-/);
    const types = allChips.map((el) => el.textContent ?? '');
    expect(types.filter((t) => t === '搞辩论')).toHaveLength(2);
    expect(types.filter((t) => t === '讲故事')).toHaveLength(2);
  });

  it('9 element label 各 ≥ 1 次', () => {
    renderHistory();
    const labels = [
      '反差', '猎奇', '借势', '共鸣',
      '低成本高回报', '以小搏大', '争议', '利益', '贪念',
    ];
    labels.forEach((label) => {
      const found = screen.getAllByText(new RegExp(label));
      expect(found.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('为什么有的人赚钱那么轻松 出现 4 次 (inputSummary → topic)', () => {
    renderHistory();
    const topics = screen.getAllByText('为什么有的人赚钱那么轻松');
    expect(topics).toHaveLength(4);
  });

  it('4 cards render with numeric ids', () => {
    renderHistory();
    expect(screen.getByTestId('history-entry-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('history-entry-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('history-entry-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('history-entry-card-4')).toBeInTheDocument();
  });

  // P1 #4: assert timestamp format shape with regex, not just non-empty
  it('timestamps 格式正确 (YYYY/M/D H:mm:ss)', () => {
    renderHistory();
    const tsRegex = /\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}:\d{2}/;
    for (const id of [1, 2, 3, 4]) {
      const el = screen.getByTestId(`history-timestamp-${id}`);
      expect(el.textContent).toMatch(tsRegex);
    }
  });

  it('copy btn click → clipboard.writeText + toast 已复制', async () => {
    renderHistory();
    const copyBtn = screen.getByTestId('history-btn-copy-1');
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(mockWriteText).toHaveBeenCalledWith('为什么有的人赚钱那么轻松');
    await waitFor(() => {
      expect(toastSuccessSpy).toHaveBeenCalledWith('已复制');
    });
  });

  // P0 #3: toast 文案已改为「查看详情」
  it('view btn click → detail drawer appears + toast 查看详情', async () => {
    renderHistory();
    const viewBtn = screen.getByTestId('history-btn-view-1');
    await act(async () => {
      fireEvent.click(viewBtn);
    });
    expect(toastInfoSpy).toHaveBeenCalledWith('查看详情');
    expect(screen.getByTestId('history-detail-drawer')).toBeInTheDocument();
  });

  it('detail drawer closes on close btn', async () => {
    renderHistory();
    await act(async () => { fireEvent.click(screen.getByTestId('history-btn-view-1')); });
    expect(screen.getByTestId('history-detail-drawer')).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByTestId('history-detail-close')); });
    expect(screen.queryByTestId('history-detail-drawer')).not.toBeInTheDocument();
  });

  // P0 #3: toast 文案已改为「已删除」
  it('delete btn click → trpc.history.delete.mutate called with id + toast', async () => {
    renderHistory();
    const deleteBtn = screen.getByTestId('history-btn-delete-1');
    await act(async () => {
      fireEvent.click(deleteBtn);
    });
    expect(mockDeleteMutate).toHaveBeenCalledWith({ id: 1 });
    await waitFor(() => {
      expect(toastSuccessSpy).toHaveBeenCalledWith('已删除');
    });
  });

  // P2 #9: KPI cards show real values with data-testid
  it('KPI 卡 记录总数 显示 server count', () => {
    renderHistory();
    const kpiCard = screen.getByTestId('history-kpi-记录总数');
    expect(kpiCard).toBeInTheDocument();
    expect(kpiCard).toHaveTextContent('42');
  });

  // P1 #8: chip-row testids are unique per entry
  it('chip-row testids 含 entryId，不重复', () => {
    renderHistory();
    for (const id of [1, 2, 3, 4]) {
      expect(screen.getByTestId(`history-chip-row-${id}`)).toBeInTheDocument();
    }
  });
});

// ── P2 #10: 空态/loading/error 真断言 ─────────────────────────────────────────

describe('History page · 空态', () => {
  it('空数组 → 暂无历史记录 渲染', () => {
    mockState = {
      list: { data: [], isLoading: false, isError: false, refetch: vi.fn() },
      count: { data: 0 },
    };
    renderHistory();
    expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
  });
});

describe('History page · 加载态', () => {
  it('isLoading → history-loading skeleton 出现，history-list 不出现', () => {
    mockState = {
      list: { data: [], isLoading: true, isError: false, refetch: vi.fn() },
      count: { data: 0 },
    };
    renderHistory();
    expect(screen.getByTestId('history-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('history-list')).not.toBeInTheDocument();
  });
});

describe('History page · 错误态', () => {
  it('isError → history-error 出现 + 重试按钮', () => {
    const mockRefetch = vi.fn();
    mockState = {
      list: { data: [], isLoading: false, isError: true, refetch: mockRefetch },
      count: { data: 0 },
    };
    renderHistory();
    expect(screen.getByTestId('history-error')).toBeInTheDocument();
    expect(screen.getByTestId('history-retry')).toBeInTheDocument();
    expect(screen.queryByTestId('history-list')).not.toBeInTheDocument();
  });

  it('重试按钮点击 → refetch 被调用', async () => {
    const mockRefetch = vi.fn();
    mockState = {
      list: { data: [], isLoading: false, isError: true, refetch: mockRefetch },
      count: { data: 0 },
    };
    renderHistory();
    await act(async () => {
      fireEvent.click(screen.getByTestId('history-retry'));
    });
    expect(mockRefetch).toHaveBeenCalled();
  });
});
