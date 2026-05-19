import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Step5 from '@/pages/step/Step5';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      get: {
        useQuery: () => ({
          data: null,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        }),
      },
      save: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      saveStream: { useSubscription: vi.fn() },
    },
  },
}));

describe('Step5', () => {
  it('renders h1 with 爆款选题库', () => {
    render(
      <MemoryRouter>
        <Step5 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款选题库');
  });

  it('renders EmptyState when no result', () => {
    render(
      <MemoryRouter>
        <Step5 />
      </MemoryRouter>,
    );
    // Output grid is not shown before form submission
    expect(screen.queryByTestId('step5-output-grid')).not.toBeInTheDocument();
  });

  it('renders CTA button 一键生成', () => {
    render(
      <MemoryRouter>
        <Step5 />
      </MemoryRouter>,
    );
    expect(screen.getByText('生成爆款选题库')).toBeInTheDocument();
  });

  it('renders industry input placeholder', () => {
    render(
      <MemoryRouter>
        <Step5 />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText(/美业/)).toBeInTheDocument();
  });

  it('renders STEP_TAG', () => {
    render(
      <MemoryRouter>
        <Step5 />
      </MemoryRouter>,
    );
    expect(screen.getByText('STEP 05 · 爆款选题库')).toBeInTheDocument();
  });
});
