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
  it('renders H1 字面锁 "文案生成"', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('文案生成');
  });

  it('renders STEP_TAG 字面锁 (AC-1 · D-224)', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText('STEP 07 · AI 智能文案生成')).toBeInTheDocument();
  });

  it('renders 选择脚本类型 label (AC-2)', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText('选择脚本类型')).toBeInTheDocument();
  });

  it('renders 生成爆款文案 CTA button (AC-2)', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText('生成爆款文案')).toBeInTheDocument();
  });

  it('renders navigation buttons (AC-2)', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText('我的选题库')).toBeInTheDocument();
    expect(screen.getByText('爆款选题')).toBeInTheDocument();
  });

  it('renders AI 优化文案 secondary button (AC-2)', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText('AI 优化文案')).toBeInTheDocument();
  });

  it('renders 4 H4 debate output sections in DOM by default (AC-4 · AC-7)', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 4, name: '话题抛出' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '正方' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '反方' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '我的立场' })).toBeInTheDocument();
  });

  it('renders 评论区引导 and 话题标签 H4 sections (AC-4)', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 4, name: '评论区引导' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '话题标签' })).toBeInTheDocument();
  });

  it('renders 优化方向 input (AC-2)', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(screen.getByText('优化方向')).toBeInTheDocument();
  });

  it('renders subtitle 字面锁 (AC-1)', () => {
    render(
      <MemoryRouter>
        <Step7 />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(
        '选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。',
      ),
    ).toBeInTheDocument();
  });
});
