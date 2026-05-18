import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Step7 from '@/pages/step/Step7';

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

describe('Step7', () => {
  it('renders h1 with 文案生成', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('文案生成');
  });

  it('renders STEP_TAG', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText('STEP 07 · AI 智能文案生成')).toBeInTheDocument();
  });

  it('renders 选择脚本类型 label from constant (TD-76)', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText('选择脚本类型')).toBeInTheDocument();
  });

  it('renders EmptyState when no result', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText(/填写主题后生成文案生成/)).toBeInTheDocument();
  });

  it('renders 生成爆款文案 button', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText('生成爆款文案')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText('我的选题库')).toBeInTheDocument();
    expect(screen.getByText('爆款选题')).toBeInTheDocument();
  });
});
