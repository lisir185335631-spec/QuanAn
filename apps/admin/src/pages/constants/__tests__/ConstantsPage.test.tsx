import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ConstantsPage from '../ConstantsPage';

const { mockGetActive } = vi.hoisted(() => ({ mockGetActive: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      constants: {
        getActiveVersion: { useQuery: mockGetActive },
        listVersions: { useQuery: q({ versions: [] }) },
        listKeys: { useQuery: q({ keys: [] }) },
        saveDraft: { useMutation: m },
        submitForReview: { useMutation: m },
        rollbackVersion: { useMutation: m },
        updateCanary: { useMutation: m },
        runLlmJudge: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockGetActive.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('ConstantsPage', () => {
  it('renders without crash', () => {
    render(<ConstantsPage />, { wrapper: MemoryRouter });
  });

  it('主标题 知识案例 tab', () => {
    render(<ConstantsPage />, { wrapper: MemoryRouter });
    expect(screen.getAllByText(/知识案例/)[0]).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockGetActive.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<ConstantsPage />, { wrapper: MemoryRouter });
  });
});
