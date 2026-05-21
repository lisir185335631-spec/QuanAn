import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import InvitesPage from '../index';

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      useUtils: () => ({}),
      inviteCodes: {
        list: { useQuery: mockList },
        detail: { useQuery: q() },
        create: { useMutation: m },
        batchImport: { useMutation: m },
        campaignFunnel: { useQuery: q() },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockList.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('InvitesPage', () => {
  it('renders without crash', () => {
    render(<InvitesPage />, { wrapper: MemoryRouter });
  });

  it('主标题 邀请码管理', () => {
    render(<InvitesPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/邀请码管理/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockList.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<InvitesPage />, { wrapper: MemoryRouter });
  });
});
