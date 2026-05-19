import { fireEvent, render, screen } from '@testing-library/react';
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
    const input = screen.getByTestId('industry-search');
    fireEvent.change(input, { target: { value: 'xyznotfound12345' } });
    expect(screen.getByText('未找到匹配的行业')).toBeInTheDocument();
  });

  it('renders CTA button with new label', () => {
    render(
      <MemoryRouter>
        <Step1 />
      </MemoryRouter>,
    );
    expect(screen.getByText('确认并进入下一步')).toBeInTheDocument();
  });

  it('CTA label uses constant not hardcoded string', () => {
    render(
      <MemoryRouter>
        <Step1 />
      </MemoryRouter>,
    );
    // STEP1_CTA = '确认并进入下一步' — aligns with PRD AC-8 D1A + aiipznt spec §7.1
    expect(screen.queryByRole('button', { name: '生成行业洞察' })).toBeNull();
    expect(screen.getByRole('button', { name: '确认并进入下一步' })).toBeInTheDocument();
  });
});
