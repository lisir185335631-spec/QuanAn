import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AccountsPage from '../index';

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      ipAccounts: {
        list: { useQuery: mockList },
        detail: { useQuery: q() },
        forceFreeze: { useMutation: m },
        unflag: { useMutation: m },
        addNote: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockList.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('AccountsPage', () => {
  it('renders without crash', () => {
    render(<AccountsPage />, { wrapper: MemoryRouter });
  });

  it('h1 主标题 IP 账号管理', () => {
    render(<AccountsPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/IP 账号管理/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockList.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<AccountsPage />, { wrapper: MemoryRouter });
  });
});
