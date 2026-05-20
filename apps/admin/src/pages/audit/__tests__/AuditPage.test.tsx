import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AuditPage from '../index';

const { mockListMine } = vi.hoisted(() => ({ mockListMine: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      audit: {
        listMine: { useQuery: mockListMine },
        byTraceId: { useQuery: q() },
        byUserId: { useQuery: q() },
        byAdminId: { useQuery: q() },
        exportPdf: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockListMine.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('AuditPage', () => {
  it('renders without crash', () => {
    render(<AuditPage />, { wrapper: MemoryRouter });
  });

  it('h2 主标题 审计日志', () => {
    render(<AuditPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/审计日志/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockListMine.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<AuditPage />, { wrapper: MemoryRouter });
  });
});
