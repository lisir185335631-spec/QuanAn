import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Step1 from '@/pages/step/Step1';

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

describe('Step1', () => {
  it('renders h1 with correct title', () => {
    render(
      <MemoryRouter>
        <Step1 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('选择你的行业赛道');
  });

  it('renders EmptyState when no result', () => {
    render(
      <MemoryRouter>
        <Step1 />
      </MemoryRouter>,
    );
    expect(screen.getByText(/提交表单后查看选择你的行业赛道/)).toBeInTheDocument();
  });

  it('renders CTA button with new label', () => {
    render(
      <MemoryRouter>
        <Step1 />
      </MemoryRouter>,
    );
    expect(screen.getByText('生成行业洞察')).toBeInTheDocument();
  });

  it('CTA label uses constant not hardcoded string', () => {
    render(
      <MemoryRouter>
        <Step1 />
      </MemoryRouter>,
    );
    // STEP1_CTA_LABEL = '生成行业洞察' — old '确认并进入下一步' removed
    expect(screen.queryByText('确认并进入下一步')).toBeNull();
    expect(screen.getByText('生成行业洞察')).toBeInTheDocument();
  });
});
