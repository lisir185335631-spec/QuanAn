import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PromptsPage from '../PromptsPage';

const { mockGetActive } = vi.hoisted(() => ({ mockGetActive: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      prompts: {
        getActiveVersion: { useQuery: mockGetActive },
        listVersions: { useQuery: q({ versions: [] }) },
        saveDraft: { useMutation: m },
        submitForReview: { useMutation: m },
        rollbackVersion: { useMutation: m },
        rollback: { useMutation: m },
        runLlmJudge: { useMutation: m },
        updateCanary: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockGetActive.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('PromptsPage', () => {
  it('renders without crash', () => {
    render(<PromptsPage />, { wrapper: MemoryRouter });
  });

  it('主标题 进化 Agent tab', () => {
    render(<PromptsPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/进化 Agent/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockGetActive.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<PromptsPage />, { wrapper: MemoryRouter });
  });
});
