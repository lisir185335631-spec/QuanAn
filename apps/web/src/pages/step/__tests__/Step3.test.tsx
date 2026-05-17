import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Step3 from '@/pages/step/Step3';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      get: { useQuery: () => ({ data: null, isLoading: false, isError: false, error: null, refetch: vi.fn() }) },
      save: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

describe('Step3', () => {
  it('renders h1 with correct title', () => {
    render(
      <MemoryRouter>
        <Step3 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('账号包装方案');
  });

  it('renders EmptyState when no result', () => {
    render(
      <MemoryRouter>
        <Step3 />
      </MemoryRouter>,
    );
    expect(screen.getByText(/提交表单后查看账号包装方案/)).toBeInTheDocument();
  });

  it('renders CTA button', () => {
    render(
      <MemoryRouter>
        <Step3 />
      </MemoryRouter>,
    );
    expect(screen.getByText('生成账号包装方案')).toBeInTheDocument();
  });

  it('shows industry prefill subtitle', () => {
    render(
      <MemoryRouter>
        <Step3 />
      </MemoryRouter>,
    );
    // subtitle uses industryLabel from readOtherStep; without accountId, shows (未选择)
    expect(screen.getByText(/当前行业：\(未选择\)/)).toBeInTheDocument();
  });
});
