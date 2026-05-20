import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UsersPage from '../index';

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      users: {
        list: { useQuery: mockList },
        changePlan: { useMutation: m },
        banUser: { useMutation: m },
        resetPassword: { useMutation: m },
        detail: { useQuery: q() },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockList.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('UsersPage', () => {
  it('renders without crash', () => {
    render(<UsersPage />, { wrapper: MemoryRouter });
  });

  it('h1 主标题 用户管理', () => {
    render(<UsersPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/用户管理/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockList.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<UsersPage />, { wrapper: MemoryRouter });
  });
});
