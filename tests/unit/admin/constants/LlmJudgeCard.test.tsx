// PRD-14 US-010 · LlmJudgeCard (constants) unit tests
// AC-7: 评分 0.00-5.00 进度条 + isMock badge + 重跑评分按钮
// @vitest-environment jsdom

import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockRunJudgeMutate = vi.hoisted(() => vi.fn());

vi.mock('../../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    constants: {
      runLlmJudge: {
        useMutation: () => ({
          mutate: mockRunJudgeMutate,
          isPending: false,
        }),
      },
    },
  },
}));

import { LlmJudgeCard } from '../../../../apps/admin/src/pages/constants/components/LlmJudgeCard';

const DEFAULT_PROPS = {
  versionId: 17,
  judgeScore: '3.50',
  isSuperAdmin: true,
  onToast: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LlmJudgeCard (constants)', () => {
  it('renders score 3.50 formatted to 2 decimal places (AC-7)', () => {
    render(<LlmJudgeCard {...DEFAULT_PROPS} />);
    expect(screen.getByText('3.50')).toBeInTheDocument();
    expect(screen.getByText('/ 5.00')).toBeInTheDocument();
  });

  it('renders isMock badge (AC-7)', () => {
    render(<LlmJudgeCard {...DEFAULT_PROPS} />);
    expect(screen.getByText('isMock')).toBeInTheDocument();
  });

  it('renders rerun button for super_admin (AC-7)', () => {
    render(<LlmJudgeCard {...DEFAULT_PROPS} />);
    expect(screen.getByRole('button', { name: '重跑评分' })).toBeInTheDocument();
  });

  it('clicking rerun calls runLlmJudge mutation with versionId (AC-7)', () => {
    render(<LlmJudgeCard {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: '重跑评分' }));
    expect(mockRunJudgeMutate).toHaveBeenCalledWith({ versionId: 17, isMock: true });
  });

  it('rerun button hidden when versionId is null', () => {
    render(<LlmJudgeCard {...DEFAULT_PROPS} versionId={null} />);
    expect(screen.queryByRole('button', { name: '重跑评分' })).not.toBeInTheDocument();
  });

  it('rerun button hidden for non-super_admin', () => {
    render(<LlmJudgeCard {...DEFAULT_PROPS} isSuperAdmin={false} />);
    expect(screen.queryByRole('button', { name: '重跑评分' })).not.toBeInTheDocument();
  });

  it('shows no-score message when judgeScore is null', () => {
    render(<LlmJudgeCard {...DEFAULT_PROPS} judgeScore={null} />);
    expect(screen.getByText(/暂无评分/)).toBeInTheDocument();
  });
});
