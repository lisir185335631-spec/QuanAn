import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AbExperimentsPage from '../AbExperimentsPage';

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      abExperiments: {
        list: { useQuery: mockList },
        getKpiStats: { useQuery: q() },
        getDetail: { useQuery: q() },
        getDetailByKey: { useQuery: q() },
        getMultiMetric: { useQuery: q() },
        getVariantMetrics: { useQuery: q() },
        getCumulativeTimeline: { useQuery: q() },
        create: { useMutation: m },
        start: { useMutation: m },
        stop: { useMutation: m },
        promoteWinner: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockList.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('AbExperimentsPage', () => {
  it('renders without crash', () => {
    render(<AbExperimentsPage />, { wrapper: MemoryRouter });
  });

  it('h2 主标题 A/B 实验管理', () => {
    render(<AbExperimentsPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/A\/B 实验管理/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockList.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<AbExperimentsPage />, { wrapper: MemoryRouter });
  });
});
