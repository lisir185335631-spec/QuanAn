import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ReviewDeepLearnPage from '../index';

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      reviewDeepLearn: {
        list: { useQuery: mockList },
        approve: { useMutation: m },
        reject: { useMutation: m },
        banUploader: { useMutation: m },
        detail: { useQuery: q() },
        userViolations: { useQuery: q() },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockList.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('ReviewDeepLearnPage', () => {
  it('renders without crash', () => {
    render(<ReviewDeepLearnPage />, { wrapper: MemoryRouter });
  });

  it('h1 主标题 DeepLearn 内容审核', () => {
    render(<ReviewDeepLearnPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/DeepLearn 内容审核/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockList.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<ReviewDeepLearnPage />, { wrapper: MemoryRouter });
  });
});
