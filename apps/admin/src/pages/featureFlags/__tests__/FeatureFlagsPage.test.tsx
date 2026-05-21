import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FeatureFlagsPage from '../FeatureFlagsPage';

const { mockKpi } = vi.hoisted(() => ({ mockKpi: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      useUtils: () => ({}),
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      featureFlags: {
        getKpiStats: { useQuery: mockKpi },
        listFeatureFlags: { useQuery: q([]) },
        listEmergencySwitches: { useQuery: q([]) },
        listSystemConfig: { useQuery: q([]) },
        listPostReview: { useQuery: q([]) },
        toggle: { useMutation: m },
        updateSystemConfig: { useMutation: m },
        emergencyToggleSystemConfig: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockKpi.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('FeatureFlagsPage', () => {
  it('renders without crash', () => {
    render(<FeatureFlagsPage />, { wrapper: MemoryRouter });
  });

  it('h2 主标题 配置中心', () => {
    render(<FeatureFlagsPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/配置中心/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockKpi.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<FeatureFlagsPage />, { wrapper: MemoryRouter });
  });
});
