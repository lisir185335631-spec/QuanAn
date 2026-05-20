import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import QuotaPage from '../QuotaPage';

const { mockOverview } = vi.hoisted(() => ({ mockOverview: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      useUtils: () => ({
        quota: {
          listAnomalousUsers: { fetch: async () => ({ items: [], nextCursor: null }) },
        },
      }),
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      quota: {
        getQuotaOverview: { useQuery: mockOverview },
        getUsageStats: { useQuery: q() },
        getHourlyTrend: { useQuery: q() },
        adjustQuota: { useMutation: m },
        getUserHourlyTimeline: { useQuery: q() },
        getActiveAdjustments: { useQuery: q() },
        getExpiredAdjustments: { useQuery: q() },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockOverview.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('QuotaPage', () => {
  it('renders without crash', () => {
    render(<QuotaPage />, { wrapper: MemoryRouter });
  });

  it('h2 主标题 配额管理', () => {
    render(<QuotaPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/配额管理/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockOverview.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<QuotaPage />, { wrapper: MemoryRouter });
  });
});
