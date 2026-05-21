import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ReviewTrendingPage from '../index';

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      reviewTrending: {
        list: { useQuery: mockList },
        batchAction: { useMutation: m },
        approve: { useMutation: m },
        reject: { useMutation: m },
        detail: { useQuery: q() },
        configRules: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockList.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('ReviewTrendingPage', () => {
  it('renders without crash', () => {
    render(<ReviewTrendingPage />, { wrapper: MemoryRouter });
  });

  it('h1 主标题 TrendingItem 内容审核', () => {
    render(<ReviewTrendingPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/TrendingItem 内容审核/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockList.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<ReviewTrendingPage />, { wrapper: MemoryRouter });
  });
});
