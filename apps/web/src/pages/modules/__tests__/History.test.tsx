/**
 * History module unit tests · sally 1:1 复刻版
 * mock-first 4 entry · 8 it 块 · 字面验收 + 交互断言
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import History from '@/pages/modules/History';

// ── mocks ──────────────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

// mock clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

let toastSuccessSpy: ReturnType<typeof vi.fn>;
let toastInfoSpy: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  mockWriteText.mockClear();
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

describe('History page · sally 1:1 视觉复刻', () => {
  it('h1 历史记录 出现', () => {
    renderHistory();
    expect(screen.getByTestId('history-h1')).toHaveTextContent('历史记录');
  });

  it('subtitle 共 4 条 出现', () => {
    renderHistory();
    expect(screen.getByTestId('history-subtitle')).toHaveTextContent('共 4 条');
  });

  it('搞辩论 出现 2 次 · 讲故事 出现 2 次', () => {
    renderHistory();
    const allText = screen.getAllByTestId(/^script-type-chip-/);
    const types = allText.map((el) => el.textContent ?? '');
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

  it('为什么有的人赚钱那么轻松 出现 4 次', () => {
    renderHistory();
    // each entry renders the topic in a <span>
    const topics = screen.getAllByText('为什么有的人赚钱那么轻松');
    expect(topics).toHaveLength(4);
  });

  it('4 timestamp 各 1 次', () => {
    renderHistory();
    expect(screen.getByTestId('history-timestamp-h1')).toHaveTextContent('2026/5/24 14:53:07');
    expect(screen.getByTestId('history-timestamp-h2')).toHaveTextContent('2026/4/14 15:33:43');
    expect(screen.getByTestId('history-timestamp-h3')).toHaveTextContent('2026/4/14 15:32:19');
    expect(screen.getByTestId('history-timestamp-h4')).toHaveTextContent('2026/3/28 09:11:02');
  });

  it('copy btn click → toast 已复制', async () => {
    renderHistory();
    const copyBtn = screen.getByTestId('history-btn-copy-h1');
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(toastSuccessSpy).toHaveBeenCalledWith('已复制');
  });

  it('view btn click → toast 查看详情 · 即将上线', async () => {
    renderHistory();
    const viewBtn = screen.getByTestId('history-btn-view-h1');
    await act(async () => {
      fireEvent.click(viewBtn);
    });
    expect(toastInfoSpy).toHaveBeenCalledWith('查看详情 · 即将上线');
  });
});
