import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NsmDashboard from '../index';

const { mockOverview } = vi.hoisted(() => ({ mockOverview: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      nsm: {
        getOverview: { useQuery: mockOverview },
        getAlerts: { useQuery: q() },
        getFunnel: { useQuery: q() },
        getDistributions: { useQuery: q() },
        triggerSnapshot: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockOverview.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('NsmDashboard', () => {
  it('renders without crash', () => {
    render(<NsmDashboard />, { wrapper: MemoryRouter });
  });

  it('h1 主标题 NSM 仪表盘', () => {
    render(<NsmDashboard />, { wrapper: MemoryRouter });
    expect(screen.getByText(/NSM 仪表盘/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockOverview.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<NsmDashboard />, { wrapper: MemoryRouter });
  });
});
