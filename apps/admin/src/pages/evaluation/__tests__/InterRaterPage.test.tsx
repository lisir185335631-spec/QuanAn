// PRD-28 US-007 · InterRaterPage unit test (AC-8 browser flow · admin vitest scope)
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom';

// Mock react-router-dom hooks
vi.mock('react-router-dom', () => ({
  useParams: () => ({ runId: 'test-run-001' }),
  useNavigate: () => vi.fn(),
}));

// Mock adminTrpc
vi.mock('../../../lib/admin-client', () => ({
  adminTrpc: {
    evaluation: {
      listInterRaterSubset: {
        useQuery: () => ({
          data: {
            samples: [
              {
                id: 1,
                goldenId: 'sally-001',
                specialistId: 'CopywritingAgent',
                mode: 'free',
                input: { topic: '测试主题' },
                actualOutput: { markdown: '测试输出' },
                criteria: ['输出不少于400字', '包含开头钩子'],
                judgeScore: 7,
                judgeReason: 'Good structure and hook.',
                humanScore: null,
                humanScoredAt: null,
              },
            ],
            totalSubset: 1,
            totalRated: 0,
          },
          isLoading: false,
          error: null,
        }),
      },
      computeAgreement: {
        useQuery: () => ({ data: null }),
      },
      submitHumanScore: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
    useUtils: () => ({
      evaluation: {
        listInterRaterSubset: { invalidate: vi.fn() },
        computeAgreement: { invalidate: vi.fn() },
      },
    }),
  },
}));

afterEach(cleanup);

// Lazy import after mocks
const { default: InterRaterPage } = await import('../InterRaterPage');

describe('InterRaterPage', () => {
  it('renders inter-rater header', () => {
    render(<InterRaterPage />);
    expect(screen.getByText(/Inter-rater Agreement/i)).toBeInTheDocument();
  });

  it('shows progress counter', () => {
    render(<InterRaterPage />);
    expect(screen.getByText(/进度 0\/1 评完/)).toBeInTheDocument();
  });

  it('renders sample card with goldenId', () => {
    render(<InterRaterPage />);
    expect(screen.getByText(/sally-001/)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<InterRaterPage />);
    expect(screen.getByRole('button', { name: /提交评分/ })).toBeInTheDocument();
  });
});
