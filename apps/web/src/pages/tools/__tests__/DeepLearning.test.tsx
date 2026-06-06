/**
 * DeepLearning.test.tsx — /tools/deep-learning
 * 阶段2: trpc mock-first · deepLearning.list/parse/delete/applyFormula/createFromFile/learn/learnStatus
 * 覆盖: header 字面锁 / 档案渲染 / parse 提交+analysis / 删除确认 / 空/loading/error 态 /
 *       <100字校验 / >10000字校验 / addThis 收集 / learn 批量 / learnStatus 轮询 /
 *       status chip 各值 / applyFormula / createFromFile / fileUrl 校验
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// ── shared mock state ─────────────────────────────────────────────────────────

type QueueRow = {
  id: number;
  sample: string;
  sourcePlatform: string;
  coreFormula: string;
  status: string;
  createdAt: string;
};

let mockListData: QueueRow[] = [];
let mockListIsLoading = false;
let mockListIsError = false;
const mockListRefetch = vi.fn();

const mockInvalidate = vi.fn().mockResolvedValue(undefined);
const mockParseMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const mockApplyMutate = vi.fn();
const mockCreateFromFileMutate = vi.fn();
const mockLearnMutate = vi.fn();

let mockParseIsPending = false;
let mockDeleteIsPending = false;
let mockApplyIsPending = false;
let mockFileIsPending = false;
let mockLearnIsPending = false;

// learnStatus polling
let mockLearnStatusData: { status: 'queued' | 'processing' | 'completed' | 'failed'; result: null } | undefined =
  undefined;

// Callbacks captured from useMutation opts
let parseMutationOnSuccess: ((data: {
  queueId: number;
  analysis: { coreFormula: string; hookType: string; structurePattern: string; emotionalArc: string; keywords: string[] };
}) => void) | null = null;
let deleteMutationOnSuccess: (() => void) | null = null;
let applyMutationOnSuccess: ((data: { content: string }) => void) | null = null;
let createFromFileMutationOnSuccess: (() => void) | null = null;
let learnMutationOnSuccess: ((data: { jobId: string; status: 'queued' }) => void) | null = null;

const SAMPLE_ROW_1: QueueRow = {
  id: 101,
  sample: '这是一篇超过四十个中文字符的文案样本内容，专门用于测试档案卡片的标题截断与显示功能，确保长标题正确省略',
  sourcePlatform: '小红书',
  coreFormula: '痛点-解决方案-信任背书',
  status: 'pending',
  createdAt: '2026-05-25T00:00:00.000Z',
};

const SAMPLE_ROW_2: QueueRow = {
  id: 102,
  sample: '第二篇文案样本短',
  sourcePlatform: '抖音',
  coreFormula: '故事-共鸣-行动',
  status: 'pending',
  createdAt: '2026-05-26T00:00:00.000Z',
};

vi.mock('@/lib/trpc', () => ({
  trpc: {
    deepLearning: {
      list: {
        useQuery: () => ({
          data: mockListIsLoading ? undefined : mockListData,
          isLoading: mockListIsLoading,
          isError: mockListIsError,
          refetch: mockListRefetch,
        }),
      },
      parse: {
        useMutation: (opts: {
          onSuccess?: (data: {
            queueId: number;
            analysis: { coreFormula: string; hookType: string; structurePattern: string; emotionalArc: string; keywords: string[] };
          }) => void;
          onError?: (err: { message: string }) => void;
        }) => {
          parseMutationOnSuccess = opts?.onSuccess ?? null;
          return {
            mutate: mockParseMutate,
            isPending: mockParseIsPending,
          };
        },
      },
      delete: {
        useMutation: (opts: {
          onSuccess?: () => void;
          onError?: (err: { message: string }) => void;
        }) => {
          deleteMutationOnSuccess = opts?.onSuccess ?? null;
          return {
            mutate: mockDeleteMutate,
            isPending: mockDeleteIsPending,
          };
        },
      },
      applyFormula: {
        useMutation: (opts: {
          onSuccess?: (data: { content: string }) => void;
          onError?: (err: { message: string }) => void;
        }) => {
          applyMutationOnSuccess = opts?.onSuccess ?? null;
          return {
            mutate: mockApplyMutate,
            isPending: mockApplyIsPending,
          };
        },
      },
      createFromFile: {
        useMutation: (opts: {
          onSuccess?: () => void;
          onError?: (err: { message: string }) => void;
        }) => {
          createFromFileMutationOnSuccess = opts?.onSuccess ?? null;
          return {
            mutate: mockCreateFromFileMutate,
            isPending: mockFileIsPending,
          };
        },
      },
      learn: {
        useMutation: (opts: {
          onSuccess?: (data: { jobId: string; status: 'queued' }) => void;
          onError?: (err: { message: string }) => void;
        }) => {
          learnMutationOnSuccess = opts?.onSuccess ?? null;
          return {
            mutate: mockLearnMutate,
            isPending: mockLearnIsPending,
          };
        },
      },
      learnStatus: {
        useQuery: (_input: unknown, _opts: unknown) => ({
          data: mockLearnStatusData,
        }),
      },
    },
    auth: { me: { useQuery: () => ({ data: null, isLoading: false }) } },
    ipAccounts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    useUtils: () => ({
      deepLearning: {
        list: { invalidate: mockInvalidate },
      },
    }),
  },
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: null,
    isLoading: false,
    isSwitching: false,
    switchTo: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, login: vi.fn(), logout: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// ── import after mocks ────────────────────────────────────────────────────────

import DeepLearning from '@/pages/tools/DeepLearning';
import { toast } from 'sonner';

function renderPage() {
  return render(
    <MemoryRouter>
      <DeepLearning />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockListData = [];
  mockListIsLoading = false;
  mockListIsError = false;
  mockParseIsPending = false;
  mockDeleteIsPending = false;
  mockApplyIsPending = false;
  mockFileIsPending = false;
  mockLearnIsPending = false;
  mockLearnStatusData = undefined;
  mockListRefetch.mockReset();
  mockInvalidate.mockReset();
  mockParseMutate.mockReset();
  mockDeleteMutate.mockReset();
  mockApplyMutate.mockReset();
  mockCreateFromFileMutate.mockReset();
  mockLearnMutate.mockReset();
  parseMutationOnSuccess = null;
  deleteMutationOnSuccess = null;
  applyMutationOnSuccess = null;
  createFromFileMutationOnSuccess = null;
  learnMutationOnSuccess = null;
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.info).mockReset();
});

// ── 1 · header 字面锁 ──────────────────────────────────────────────────────────

describe('DeepLearning · header 字面锁', () => {
  it('品牌双 badge: "智能引擎" + "AI 训练"', () => {
    renderPage();
    expect(screen.getByText('智能引擎')).toBeInTheDocument();
    expect(screen.getByText('AI 训练')).toBeInTheDocument();
  });

  it('h1 · 文案深度学习', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('文案深度学习');
  });

  it('subtitle 含关键词 "深度分析文案逻辑、包装风格"', () => {
    renderPage();
    expect(screen.getByTestId('deep-learning-subtitle')).toHaveTextContent('深度分析文案逻辑、包装风格');
  });
});

// ── 2 · form 字面锁 ────────────────────────────────────────────────────────────

describe('DeepLearning · form 字面锁', () => {
  it('2 tab "上传文件" / "粘贴文案" 均出现', () => {
    renderPage();
    expect(screen.getByTestId('tab-upload')).toHaveTextContent('上传文件');
    expect(screen.getByTestId('tab-paste')).toHaveTextContent('粘贴文案');
  });

  it('paste tab 下 CTA "开始深度学习" 出现', () => {
    renderPage();
    expect(screen.getByTestId('start-learning-btn')).toHaveTextContent('开始深度学习');
  });

  it('字符计数 "0 字" 出现', () => {
    renderPage();
    expect(screen.getByText('0 字')).toBeInTheDocument();
  });

  it('Ctrl+Enter hint 出现', () => {
    renderPage();
    expect(screen.getByTestId('ctrl-enter-hint')).toHaveTextContent('Ctrl+Enter 快速添加');
  });
});

// ── 3 · 档案区列表渲染真行 ─────────────────────────────────────────────────────

describe('DeepLearning · 档案渲染真行', () => {
  it('有档案时渲染 archive-card-{id}', () => {
    mockListData = [SAMPLE_ROW_1];
    renderPage();
    expect(screen.getByTestId('archive-card-101')).toBeInTheDocument();
  });

  it('档案标题截取前40字并带省略号', () => {
    mockListData = [SAMPLE_ROW_1];
    renderPage();
    const title = screen.getByTestId('archive-title');
    // sample is >40 chars, so truncated with …
    expect(title).toHaveTextContent('…');
  });

  it('status=pending → chip 显示"待审核"', () => {
    mockListData = [{ ...SAMPLE_ROW_1, status: 'pending' }];
    renderPage();
    expect(screen.getByTestId('archive-done-chip')).toHaveTextContent('待审核');
  });

  it('status=approved → chip 显示"已完成"', () => {
    mockListData = [{ ...SAMPLE_ROW_1, status: 'approved' }];
    renderPage();
    expect(screen.getByTestId('archive-done-chip')).toHaveTextContent('已完成');
  });

  it('status=rejected → chip 显示"已拒绝"', () => {
    mockListData = [{ ...SAMPLE_ROW_1, status: 'rejected' }];
    renderPage();
    expect(screen.getByTestId('archive-done-chip')).toHaveTextContent('已拒绝');
  });

  it('status=cancelled → chip 显示"已取消"', () => {
    mockListData = [{ ...SAMPLE_ROW_1, status: 'cancelled' }];
    renderPage();
    expect(screen.getByTestId('archive-done-chip')).toHaveTextContent('已取消');
  });

  it('展开状态: style-portrait / logic / packaging / highlights 各出现', () => {
    mockListData = [SAMPLE_ROW_1];
    renderPage();
    expect(screen.getByTestId('style-portrait-section')).toBeInTheDocument();
    expect(screen.getByTestId('logic-grid-section')).toBeInTheDocument();
    expect(screen.getByTestId('packaging-grid-section')).toBeInTheDocument();
    expect(screen.getByTestId('highlights-section')).toBeInTheDocument();
  });

  it('style-portrait-body 含核心公式文本', () => {
    mockListData = [SAMPLE_ROW_1];
    renderPage();
    expect(screen.getByTestId('style-portrait-body')).toHaveTextContent('痛点-解决方案-信任背书');
  });

  it('toggle 折叠后 archive-expanded 消失', () => {
    mockListData = [SAMPLE_ROW_1];
    renderPage();
    expect(screen.getByTestId('archive-expanded')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('archive-toggle-btn'));
    expect(screen.queryByTestId('archive-expanded')).not.toBeInTheDocument();
  });

  it('多行: 2 档案各自渲染自己的 card', () => {
    mockListData = [SAMPLE_ROW_1, SAMPLE_ROW_2];
    renderPage();
    expect(screen.getByTestId('archive-card-101')).toBeInTheDocument();
    expect(screen.getByTestId('archive-card-102')).toBeInTheDocument();
  });

  it('archives-heading 显示档案数(2)', () => {
    mockListData = [SAMPLE_ROW_1, SAMPLE_ROW_2];
    renderPage();
    expect(screen.getByTestId('archives-heading')).toHaveTextContent('学习档案');
    expect(screen.getByTestId('archives-heading')).toHaveTextContent('(2)');
  });
});

// ── 4 · 空态 ───────────────────────────────────────────────────────────────────

describe('DeepLearning · 空态', () => {
  it('data=[] → empty-archives 出现', () => {
    mockListData = [];
    renderPage();
    expect(screen.getByTestId('empty-archives')).toBeInTheDocument();
  });

  it('empty-archives 含 "还没有学习档案"', () => {
    mockListData = [];
    renderPage();
    expect(screen.getByTestId('empty-archives')).toHaveTextContent('还没有学习档案');
  });
});

// ── 5 · loading 态 ─────────────────────────────────────────────────────────────

describe('DeepLearning · loading 态', () => {
  it('isLoading=true → archives-skeleton 出现', () => {
    mockListIsLoading = true;
    renderPage();
    expect(screen.getByTestId('archives-skeleton')).toBeInTheDocument();
  });

  it('isLoading=true → empty-archives 不出现', () => {
    mockListIsLoading = true;
    renderPage();
    expect(screen.queryByTestId('empty-archives')).not.toBeInTheDocument();
  });
});

// ── 6 · error 态 ───────────────────────────────────────────────────────────────

describe('DeepLearning · error 态', () => {
  it('isError=true → archives-error 出现', () => {
    mockListIsError = true;
    renderPage();
    expect(screen.getByTestId('archives-error')).toBeInTheDocument();
  });

  it('archives-error 含 "加载学习档案失败"', () => {
    mockListIsError = true;
    renderPage();
    expect(screen.getByTestId('archives-error')).toHaveTextContent('加载学习档案失败');
  });

  it('点"重试"按钮 → 调 refetch', () => {
    mockListIsError = true;
    renderPage();
    const retryBtn = screen.getByRole('button', { name: '重试' });
    fireEvent.click(retryBtn);
    expect(mockListRefetch).toHaveBeenCalledTimes(1);
  });
});

// ── 7 · <100 字校验 ────────────────────────────────────────────────────────────

describe('DeepLearning · <100 字校验', () => {
  it('文案 < 100 字时显示 text-length-warning', () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    fireEvent.change(textarea, { target: { value: '短文案' } });
    expect(screen.getByTestId('text-length-warning')).toBeInTheDocument();
    expect(screen.getByTestId('text-length-warning')).toHaveTextContent('文案需不少于 100 字');
  });

  it('文案 >= 100 字时不显示 text-length-warning', () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    const longText = '这是'.repeat(55); // 110 字
    fireEvent.change(textarea, { target: { value: longText } });
    expect(screen.queryByTestId('text-length-warning')).not.toBeInTheDocument();
  });

  it('start-learning-btn 在文案 < 100 字时 disabled', () => {
    renderPage();
    // default: text = '' → length 0 < 100
    const btn = screen.getByTestId('start-learning-btn');
    expect(btn).toBeDisabled();
  });

  it('start-learning-btn 在文案 >= 100 字时 enabled', () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    const longText = '这是'.repeat(55); // 110 字
    fireEvent.change(textarea, { target: { value: longText } });
    const btn = screen.getByTestId('start-learning-btn');
    expect(btn).not.toBeDisabled();
  });
});

// ── 8 · >10000 字校验 ─────────────────────────────────────────────────────────

describe('DeepLearning · >10000 字校验', () => {
  it('文案 > 10000 字时显示 text-too-long-warning', () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    // jsdom does not enforce maxLength on textarea in fireEvent, so simulate value > 10000
    const tooLong = 'a'.repeat(10001);
    fireEvent.change(textarea, { target: { value: tooLong } });
    expect(screen.getByTestId('text-too-long-warning')).toBeInTheDocument();
    expect(screen.getByTestId('text-too-long-warning')).toHaveTextContent('超过 10000 字');
  });

  it('文案 > 10000 字时 start-learning-btn disabled', () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    const tooLong = 'a'.repeat(10001);
    fireEvent.change(textarea, { target: { value: tooLong } });
    expect(screen.getByTestId('start-learning-btn')).toBeDisabled();
  });

  it('文案 > 10000 字时 add-this-btn disabled', () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    const tooLong = 'a'.repeat(10001);
    fireEvent.change(textarea, { target: { value: tooLong } });
    expect(screen.getByTestId('add-this-btn')).toBeDisabled();
  });
});

// ── 9 · parse 提交 + analysis 显示 ────────────────────────────────────────────

describe('DeepLearning · parse 提交 + analysis 显示', () => {
  it('点 start-learning-btn → 调 parseMutation.mutate', () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    const longText = '测试文案'.repeat(30); // 120 字
    fireEvent.change(textarea, { target: { value: longText } });
    fireEvent.click(screen.getByTestId('start-learning-btn'));
    expect(mockParseMutate).toHaveBeenCalledTimes(1);
    expect(mockParseMutate).toHaveBeenCalledWith(
      expect.objectContaining({ sample: longText, sourcePlatform: 'xiaohongshu' }),
    );
  });

  it('parse onSuccess → parse-result + analysis 字段显示', async () => {
    renderPage();

    parseMutationOnSuccess?.({
      queueId: 99,
      analysis: {
        coreFormula: '痛点-解决方案-信任背书',
        hookType: '问题引发共鸣',
        structurePattern: '开头悬念→中段铺陈→结尾号召',
        emotionalArc: '焦虑→共鸣→希望→行动',
        keywords: ['美业', 'AI', '效率'],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('parse-result')).toBeInTheDocument();
    });
    expect(screen.getByTestId('parse-core-formula')).toHaveTextContent('痛点-解决方案-信任背书');
    expect(screen.getByTestId('parse-hook-type')).toHaveTextContent('问题引发共鸣');
    expect(screen.getByTestId('parse-structure-pattern')).toHaveTextContent('开头悬念');
    expect(screen.getByTestId('parse-emotional-arc')).toHaveTextContent('焦虑');
    expect(screen.getByTestId('parse-keywords')).toBeInTheDocument();
  });

  it('parse onSuccess → invalidate 调用', async () => {
    renderPage();
    parseMutationOnSuccess?.({
      queueId: 99,
      analysis: {
        coreFormula: '公式',
        hookType: '钩子',
        structurePattern: '结构',
        emotionalArc: '弧线',
        keywords: [],
      },
    });
    await waitFor(() => {
      expect(mockInvalidate).toHaveBeenCalled();
    });
  });

  it('parse onSuccess → apply-formula-section 显示(有 parsedQueueId)', async () => {
    renderPage();
    parseMutationOnSuccess?.({
      queueId: 77,
      analysis: {
        coreFormula: '公式',
        hookType: '钩子',
        structurePattern: '结构',
        emotionalArc: '弧线',
        keywords: ['词1'],
      },
    });
    await waitFor(() => {
      expect(screen.getByTestId('apply-formula-section')).toBeInTheDocument();
    });
  });
});

// ── 10 · applyFormula 调用 + 结果显示 ──────────────────────────────────────────

describe('DeepLearning · applyFormula', () => {
  it('点 apply-formula-btn → 调 applyMutation.mutate', async () => {
    renderPage();
    // Trigger parse result first so apply section appears
    parseMutationOnSuccess?.({
      queueId: 55,
      analysis: {
        coreFormula: '公式',
        hookType: '钩子',
        structurePattern: '结构',
        emotionalArc: '弧线',
        keywords: [],
      },
    });
    await waitFor(() => expect(screen.getByTestId('apply-formula-section')).toBeInTheDocument());

    const input = screen.getByTestId('apply-topic-input');
    fireEvent.change(input, { target: { value: '护肤品推广' } });
    fireEvent.click(screen.getByTestId('apply-formula-btn'));

    expect(mockApplyMutate).toHaveBeenCalledWith(
      expect.objectContaining({ queueId: 55, newTopic: '护肤品推广' }),
    );
  });

  it('applyFormula onSuccess → apply-formula-result 显示', async () => {
    renderPage();
    parseMutationOnSuccess?.({
      queueId: 55,
      analysis: {
        coreFormula: '公式',
        hookType: '钩子',
        structurePattern: '结构',
        emotionalArc: '弧线',
        keywords: [],
      },
    });
    await waitFor(() => expect(screen.getByTestId('apply-formula-section')).toBeInTheDocument());

    applyMutationOnSuccess?.({ content: '生成的文案内容示例' });

    await waitFor(() => {
      expect(screen.getByTestId('apply-formula-result')).toHaveTextContent('生成的文案内容示例');
    });
  });
});

// ── 11 · addThis 收集 + sampleCount ────────────────────────────────────────────

describe('DeepLearning · addThis 收集', () => {
  it('输入 ≥10 字后点 add-this-btn → 收集列表出现 + sampleCount 加一', async () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    fireEvent.change(textarea, { target: { value: '这是一篇用于测试的文案内容，确保超过十个字符' } });
    fireEvent.click(screen.getByTestId('add-this-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('collected-samples')).toBeInTheDocument();
    });
    expect(screen.getByTestId('collected-sample-0')).toBeInTheDocument();
    // sampleCount shown in textarea hint
    expect(screen.getByText(/已添加 1 篇文案样本/)).toBeInTheDocument();
  });

  it('addThis 后 textarea 清空', async () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    fireEvent.change(textarea, { target: { value: '这是一篇用于测试的文案内容，确保超过十个字符' } });
    fireEvent.click(screen.getByTestId('add-this-btn'));

    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });
  });

  it('remove-sample-0 → 收集列表移除该项', async () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    fireEvent.change(textarea, { target: { value: '这是一篇用于测试的文案内容，确保超过十个字符' } });
    fireEvent.click(screen.getByTestId('add-this-btn'));

    await waitFor(() => expect(screen.getByTestId('collected-sample-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('remove-sample-0'));

    await waitFor(() => {
      expect(screen.queryByTestId('collected-sample-0')).not.toBeInTheDocument();
    });
  });

  it('有 samples 时 start-learning-btn enabled (即使 textarea 空)', async () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    fireEvent.change(textarea, { target: { value: '这是一篇用于测试的文案内容，确保超过十个字符' } });
    fireEvent.click(screen.getByTestId('add-this-btn'));

    await waitFor(() => expect(screen.getByTestId('collected-sample-0')).toBeInTheDocument());

    const btn = screen.getByTestId('start-learning-btn');
    expect(btn).not.toBeDisabled();
  });
});

// ── 12 · learn 批量提交 + learnStatus 轮询 ────────────────────────────────────

describe('DeepLearning · learn 批量提交', () => {
  it('有 samples 时点 start-learning-btn → 调 learnMutation.mutate', async () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    fireEvent.change(textarea, { target: { value: '这是一篇用于测试的文案内容，确保超过十个字符' } });
    fireEvent.click(screen.getByTestId('add-this-btn'));

    await waitFor(() => expect(screen.getByTestId('collected-sample-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('start-learning-btn'));

    expect(mockLearnMutate).toHaveBeenCalledTimes(1);
    expect(mockLearnMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        samples: expect.arrayContaining([
          expect.objectContaining({ text: expect.any(String), source: 'xiaohongshu' }),
        ]),
      }),
    );
  });

  it('learn onSuccess → 显示 learn-job-status 面板', async () => {
    renderPage();
    const textarea = screen.getByTestId('dl-textarea');
    fireEvent.change(textarea, { target: { value: '这是一篇用于测试的文案内容，确保超过十个字符' } });
    fireEvent.click(screen.getByTestId('add-this-btn'));

    await waitFor(() => expect(screen.getByTestId('collected-sample-0')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('start-learning-btn'));

    learnMutationOnSuccess?.({ jobId: 'test-job-123', status: 'queued' });
    // Set learnStatus data for queued
    mockLearnStatusData = { status: 'queued', result: null };

    await waitFor(() => {
      expect(screen.getByTestId('learn-job-status')).toBeInTheDocument();
    });
  });
});

// ── 13 · 删除档案 + 确认对话框 ────────────────────────────────────────────────

describe('DeepLearning · 删除档案', () => {
  it('点 archive-delete-btn → 弹出确认对话框', async () => {
    mockListData = [SAMPLE_ROW_1];
    renderPage();
    fireEvent.click(screen.getByTestId('archive-delete-btn'));
    expect(await screen.findByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('confirm=true → 调 deleteMutation.mutate({ archiveId })', async () => {
    mockListData = [SAMPLE_ROW_1];
    renderPage();
    fireEvent.click(screen.getByTestId('archive-delete-btn'));
    const btn = await screen.findByTestId('confirm-dialog-confirm');
    fireEvent.click(btn);
    expect(mockDeleteMutate).toHaveBeenCalledWith({ archiveId: 101 });
  });

  it('confirm=false → 不调 deleteMutation.mutate', async () => {
    mockListData = [SAMPLE_ROW_1];
    renderPage();
    fireEvent.click(screen.getByTestId('archive-delete-btn'));
    const c = await screen.findByTestId('confirm-dialog-cancel');
    fireEvent.click(c);
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it('delete onSuccess → toast 显示"学习档案已删除"', async () => {
    mockListData = [SAMPLE_ROW_1];
    renderPage();
    deleteMutationOnSuccess?.();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('学习档案已删除');
    });
  });

  it('delete onSuccess → invalidate 调用', async () => {
    mockListData = [SAMPLE_ROW_1];
    renderPage();
    deleteMutationOnSuccess?.();
    await waitFor(() => {
      expect(mockInvalidate).toHaveBeenCalled();
    });
  });
});

// ── 14 · 使用说明 字面锁 ──────────────────────────────────────────────────────

describe('DeepLearning · 使用说明', () => {
  it('usage-instructions 出现', () => {
    renderPage();
    expect(screen.getByTestId('usage-instructions')).toBeInTheDocument();
    expect(screen.getByTestId('usage-instructions-title')).toHaveTextContent('使用说明');
  });

  it('3 section: 文件上传模式 / 文案粘贴模式 / 通用说明', () => {
    renderPage();
    expect(screen.getByTestId('usage-section-title-0')).toHaveTextContent('文件上传模式：');
    expect(screen.getByTestId('usage-section-title-1')).toHaveTextContent('文案粘贴模式：');
    expect(screen.getByTestId('usage-section-title-2')).toHaveTextContent('通用说明：');
  });
});

// ── 15 · upload tab + createFromFile + fileUrl 校验 ───────────────────────────

describe('DeepLearning · upload tab', () => {
  it('点 tab-upload 切换到上传面板', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('tab-upload'));
    expect(screen.getByTestId('upload-tab-content')).toBeInTheDocument();
  });

  it('upload-tab-content 含诚实说明文字', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('tab-upload'));
    expect(screen.getByTestId('upload-tab-content')).toHaveTextContent('文件直传即将上线');
  });

  it('file-url-input 可输入', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('tab-upload'));
    const input = screen.getByTestId('file-url-input');
    fireEvent.change(input, { target: { value: 'https://example.com/file.pdf' } });
    expect((input as HTMLInputElement).value).toBe('https://example.com/file.pdf');
  });

  it('合法 URL 点 file-submit-btn → 调 createFromFileMutate', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('tab-upload'));
    const input = screen.getByTestId('file-url-input');
    fireEvent.change(input, { target: { value: 'https://example.com/file.pdf' } });
    fireEvent.click(screen.getByTestId('file-submit-btn'));
    expect(mockCreateFromFileMutate).toHaveBeenCalledWith(
      expect.objectContaining({ fileUrl: 'https://example.com/file.pdf' }),
    );
  });

  it('非法 URL 点 file-submit-btn → toast.error 不调 createFromFileMutate', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('tab-upload'));
    const input = screen.getByTestId('file-url-input');
    fireEvent.change(input, { target: { value: 'not-a-url' } });
    fireEvent.click(screen.getByTestId('file-submit-btn'));
    expect(mockCreateFromFileMutate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('createFromFile onSuccess → 文件 URL 清空', async () => {
    renderPage();
    fireEvent.click(screen.getByTestId('tab-upload'));
    const input = screen.getByTestId('file-url-input');
    fireEvent.change(input, { target: { value: 'https://example.com/file.pdf' } });
    createFromFileMutationOnSuccess?.();
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('');
    });
  });
});
