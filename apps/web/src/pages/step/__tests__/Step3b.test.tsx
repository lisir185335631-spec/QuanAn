import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Step3b from '@/pages/step/Step3b';

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

describe('Step3b', () => {
  it('renders h1 with correct title', () => {
    render(
      <MemoryRouter>
        <Step3b />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('人设定制方案');
  });

  it('renders EmptyState when no result', () => {
    render(
      <MemoryRouter>
        <Step3b />
      </MemoryRouter>,
    );
    expect(screen.getByText(/提交表单后查看人设定制方案/)).toBeInTheDocument();
  });

  it('renders CTA button', () => {
    render(
      <MemoryRouter>
        <Step3b />
      </MemoryRouter>,
    );
    expect(screen.getByText('生成专属人设方案')).toBeInTheDocument();
  });

  it('renders personal info textarea label', () => {
    render(
      <MemoryRouter>
        <Step3b />
      </MemoryRouter>,
    );
    expect(screen.getByText('你的个人信息')).toBeInTheDocument();
  });
});
