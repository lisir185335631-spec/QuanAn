import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Step8 from '@/pages/step/Step8';

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
    },
  },
}));

describe('Step8', () => {
  it('renders h1 with 直播策划', () => {
    render(
      <MemoryRouter>
        <Step8 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('直播策划');
  });

  it('renders STEP_TAG', () => {
    render(
      <MemoryRouter>
        <Step8 />
      </MemoryRouter>,
    );
    expect(screen.getByText('STEP 08 · 直播策划')).toBeInTheDocument();
  });

  it('renders 2 subfunction H3 tab buttons', () => {
    render(
      <MemoryRouter>
        <Step8 />
      </MemoryRouter>,
    );
    expect(screen.getByText('子功能 1：生成直播方案')).toBeInTheDocument();
    expect(screen.getByText('子功能 2：AI 优化直播话术')).toBeInTheDocument();
  });

  it('renders generate_plan tab by default (activeIdx=0)', () => {
    render(
      <MemoryRouter>
        <Step8 />
      </MemoryRouter>,
    );
    expect(screen.getByText('生成直播方案')).toBeInTheDocument();
  });

  it('renders EmptyState for generate_plan with template literal pattern', () => {
    render(
      <MemoryRouter>
        <Step8 />
      </MemoryRouter>,
    );
    expect(screen.getByText('提交表单后查看直播策划')).toBeInTheDocument();
  });

  it('renders experience radio options', () => {
    render(
      <MemoryRouter>
        <Step8 />
      </MemoryRouter>,
    );
    expect(screen.getByText('新手 · 刚开始做直播')).toBeInTheDocument();
    expect(screen.getByText('有经验 · 有一定直播经验')).toBeInTheDocument();
    expect(screen.getByText('资深 · 直播经验丰富')).toBeInTheDocument();
  });

  it('generate button is initially enabled (no required fields)', () => {
    render(
      <MemoryRouter>
        <Step8 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: '生成直播方案' })).not.toBeDisabled();
  });
});
