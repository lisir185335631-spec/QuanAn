import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CostPage from '../index';

const { mockAggregate } = vi.hoisted(() => ({ mockAggregate: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      useUtils: () => ({}),
      cost: {
        aggregate: { useQuery: mockAggregate },
        alerts: { useQuery: q() },
        exportCsv: { useQuery: q(null) },
        exportMonthlyPdf: { useMutation: m },
        top10: { useQuery: q() },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockAggregate.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('CostPage', () => {
  it('renders without crash', () => {
    render(<CostPage />, { wrapper: MemoryRouter });
  });

  it('h1 主标题 成本仪表盘', () => {
    render(<CostPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/成本仪表盘/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockAggregate.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<CostPage />, { wrapper: MemoryRouter });
  });
});
