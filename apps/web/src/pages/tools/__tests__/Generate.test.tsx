/**
 * Generate.test.tsx — /generate 字面锁测试
 * 验证: h1 / subtitle / 3 section title / default topic / 8 段 label / 3 action btn /
 *        ≥5 script type label / ≥5 element label / feedback prompt
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// ── PioneerLayout requires trpc + useAuth + useActiveAccount ─────────────────
vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: { me: { useQuery: () => ({ data: null, isLoading: false }) } },
    ipAccounts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: null,
    isLoading: false,
    isSwitching: false,
    switchTo: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

import Generate from '@/pages/tools/Generate';

function renderGenerate() {
  return render(
    <MemoryRouter>
      <Generate />
    </MemoryRouter>,
  );
}

describe('Generate · 字面锁', () => {
  it('h1 · 生成爆款文案', () => {
    renderGenerate();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('生成爆款文案');
  });

  it('subtitle · 选择脚本类型和爆款元素，输入主题，AI为你生成AIP风格的短视频文案', () => {
    renderGenerate();
    expect(
      screen.getByText('选择脚本类型和爆款元素，输入主题，AI为你生成AIP风格的短视频文案'),
    ).toBeInTheDocument();
  });

  it('section title · 选择脚本类型', () => {
    renderGenerate();
    expect(screen.getByText('选择脚本类型')).toBeInTheDocument();
  });

  it('section title · 爆款元素（可多选）', () => {
    renderGenerate();
    expect(screen.getByText('爆款元素（可多选）')).toBeInTheDocument();
  });

  it('section title · 文案主题', () => {
    renderGenerate();
    expect(screen.getByText('文案主题')).toBeInTheDocument();
  });

  it('topic default value · 如何在3天内涨粉1万、新手做短视频最容易犯的3个错误', () => {
    renderGenerate();
    expect(
      screen.getByDisplayValue('如何在3天内涨粉1万、新手做短视频最容易犯的3个错误'),
    ).toBeInTheDocument();
  });

  it('字符 count 显示 · {n}/500', () => {
    renderGenerate();
    expect(screen.getByText(/\/500/)).toBeInTheDocument();
  });

  it('CTA · 生成文案', () => {
    renderGenerate();
    expect(screen.getByText('生成文案')).toBeInTheDocument();
  });

  it('result title · 生成结果', () => {
    renderGenerate();
    expect(screen.getByText('生成结果')).toBeInTheDocument();
  });

  it('action btn · 复制', () => {
    renderGenerate();
    expect(screen.getByText('复制')).toBeInTheDocument();
  });

  it('action btn · AI优化', () => {
    renderGenerate();
    expect(screen.getByText('AI优化')).toBeInTheDocument();
  });

  it('action btn · 重新开始', () => {
    renderGenerate();
    expect(screen.getByText('重新开始')).toBeInTheDocument();
  });

  it('feedback prompt · 这个结果对你有帮助吗?', () => {
    renderGenerate();
    expect(screen.getByText('这个结果对你有帮助吗?')).toBeInTheDocument();
  });
});

describe('Generate · 8 段 mock 文案 label 字面锁', () => {
  it('【标题】', () => {
    renderGenerate();
    expect(screen.getByText('【标题】')).toBeInTheDocument();
  });

  it('【炸裂开头】', () => {
    renderGenerate();
    expect(screen.getByText('【炸裂开头】')).toBeInTheDocument();
  });

  it('【论证一】', () => {
    renderGenerate();
    expect(screen.getByText('【论证一】')).toBeInTheDocument();
  });

  it('【论证二】', () => {
    renderGenerate();
    expect(screen.getByText('【论证二】')).toBeInTheDocument();
  });

  it('【论证三】', () => {
    renderGenerate();
    expect(screen.getByText('【论证三】')).toBeInTheDocument();
  });

  it('【深层洞察】', () => {
    renderGenerate();
    expect(screen.getByText('【深层洞察】')).toBeInTheDocument();
  });

  it('【收尾】', () => {
    renderGenerate();
    expect(screen.getByText('【收尾】')).toBeInTheDocument();
  });

  it('【话题标签】', () => {
    renderGenerate();
    expect(screen.getByText('【话题标签】')).toBeInTheDocument();
  });
});

describe('Generate · script type labels(≥5)', () => {
  it('聊观点', () => {
    renderGenerate();
    expect(screen.getByText('聊观点')).toBeInTheDocument();
  });
  it('晒过程', () => {
    renderGenerate();
    expect(screen.getByText('晒过程')).toBeInTheDocument();
  });
  it('教知识', () => {
    renderGenerate();
    expect(screen.getByText('教知识')).toBeInTheDocument();
  });
  it('讲故事', () => {
    renderGenerate();
    expect(screen.getByText('讲故事')).toBeInTheDocument();
  });
  it('打鸡血', () => {
    renderGenerate();
    expect(screen.getByText('打鸡血')).toBeInTheDocument();
  });
});

describe('Generate · element labels(≥5)', () => {
  it('贪念', () => {
    renderGenerate();
    expect(screen.getByText('贪念')).toBeInTheDocument();
  });
  it('恐惧', () => {
    renderGenerate();
    expect(screen.getByText('恐惧')).toBeInTheDocument();
  });
  it('共鸣', () => {
    renderGenerate();
    expect(screen.getByText('共鸣')).toBeInTheDocument();
  });
  it('猎奇', () => {
    renderGenerate();
    expect(screen.getByText('猎奇')).toBeInTheDocument();
  });
  it('热点', () => {
    renderGenerate();
    expect(screen.getByText('热点')).toBeInTheDocument();
  });
});

describe('Generate · 交互', () => {
  it('script type click 切换选中', () => {
    renderGenerate();
    const btn = screen.getByText('晒过程').closest('button')!;
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('data-state', 'active');
  });

  it('element click 多选', () => {
    renderGenerate();
    const btn = screen.getByText('贪念').closest('button')!;
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('data-state', 'active');
  });

  it('textarea 改值 · count 同步', () => {
    renderGenerate();
    const ta = screen.getByDisplayValue(
      '如何在3天内涨粉1万、新手做短视频最容易犯的3个错误',
    );
    fireEvent.change(ta, { target: { value: 'abc' } });
    expect(screen.getByText('3/500')).toBeInTheDocument();
  });
});
