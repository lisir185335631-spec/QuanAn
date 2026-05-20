import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ApprovalGatesPage from '../index';

const { mockKpi } = vi.hoisted(() => ({ mockKpi: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      useUtils: () => ({
        approvals: {
          listPending: { fetch: async () => ({ items: [], nextCursor: null }) },
          listDecided: { fetch: async () => ({ items: [], nextCursor: null }) },
        },
      }),
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      approvals: {
        getKpiStats: { useQuery: mockKpi },
        listPostReview: { useQuery: q() },
        emergencyApprove: { useMutation: m },
        getHistoricalDecisions: { useQuery: q() },
        approveRequest: { useMutation: m },
        rejectRequest: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockKpi.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('ApprovalGatesPage', () => {
  it('renders without crash', () => {
    render(<ApprovalGatesPage />, { wrapper: MemoryRouter });
  });

  it('h2 主标题 Approval Gates', () => {
    render(<ApprovalGatesPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/Approval Gates/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockKpi.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<ApprovalGatesPage />, { wrapper: MemoryRouter });
  });
});
