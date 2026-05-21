import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EvolutionHealthPage from '../EvolutionHealthPage';

const { mockLDist } = vi.hoisted(() => ({ mockLDist: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      evolution: {
        getLDistribution: { useQuery: mockLDist },
        getFlywheelHealth: { useQuery: q() },
        listAnomalies: { useQuery: q() },
        getAnomalyStats: { useQuery: q() },
        getAccountTimeline: { useQuery: q() },
        forceRebuildEvolution: { useMutation: m },
        markAnomalyResolved: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockLDist.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('EvolutionHealthPage', () => {
  it('renders without crash', () => {
    render(<EvolutionHealthPage />, { wrapper: MemoryRouter });
  });

  it('h1 主标题 进化档案监控', () => {
    render(<EvolutionHealthPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/进化档案监控/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockLDist.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<EvolutionHealthPage />, { wrapper: MemoryRouter });
  });
});
