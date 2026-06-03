/**
 * Knowledge.test.tsx — /knowledge · 先锋白迁移后 mock-first 验证
 * SPEC §11 D1 字面锁
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';
import Knowledge from '@/pages/tools/Knowledge';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// trpc mock — PioneerLayout uses ipAccounts.list + auth hooks
vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    auth: {
      me: { useQuery: () => ({ data: null, isLoading: false }) },
    },
  },
}));

// useAuth hook mock — PioneerLayout HeaderRight
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, login: vi.fn(), logout: vi.fn() }),
}));

// useActiveAccount hook mock — PioneerLayout AccountSwitcherPw
vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({ account: null, switchTo: vi.fn() }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <Knowledge />
    </MemoryRouter>,
  );
}

describe('Knowledge · header 字面锁', () => {
  it('h1 显示 "AIP文案方法论"(无空格)', () => {
    renderPage();
    expect(screen.getByTestId('knowledge-h1')).toHaveTextContent('AIP文案方法论');
  });

  it('subtitle 含关键词 "系统学习AIP"', () => {
    renderPage();
    expect(screen.getByTestId('knowledge-subtitle')).toHaveTextContent('系统学习AIP');
  });
});

describe('Knowledge · 4 tab 字面锁', () => {
  it('tab-scripts 显示 "20类脚本"(无空格)', () => {
    renderPage();
    expect(screen.getByTestId('tab-scripts')).toHaveTextContent('20类脚本');
  });

  it('tab-elements 显示 "20大爆款"(无空格)', () => {
    renderPage();
    expect(screen.getByTestId('tab-elements')).toHaveTextContent('20大爆款');
  });

  it('tab-opening 显示 "开头公式"', () => {
    renderPage();
    expect(screen.getByTestId('tab-opening')).toHaveTextContent('开头公式');
  });

  it('tab-core 显示 "核心公式"', () => {
    renderPage();
    expect(screen.getByTestId('tab-core')).toHaveTextContent('核心公式');
  });
});

describe('Knowledge · Tab 1 · 20 类脚本字面锁', () => {
  it('count text 含 "共 20 类"', () => {
    renderPage();
    expect(screen.getByTestId('script-count')).toHaveTextContent('共 20 类');
  });

  it('渲染 20 个 script-card', () => {
    renderPage();
    // ScriptTab is default tab, cards are visible
    const cards = screen.getAllByTestId(/^script-card-/);
    expect(cards.length).toBe(20);
  });
});

describe('Knowledge · Tab 2 · elements filter chip 常量锁', () => {
  // Tab 2 content is lazily rendered by Radix · validate via constants instead of DOM
  it('KNOWLEDGE_PAGE filter chips 全部 5 个字面锁', () => {
    expect(KNOWLEDGE_PAGE.filterChips.all).toBe('全部');
    expect(KNOWLEDGE_PAGE.filterChips.classic).toBe('经典元素');
    expect(KNOWLEDGE_PAGE.filterChips.emotion).toBe('情绪驱动');
    expect(KNOWLEDGE_PAGE.filterChips.content).toBe('内容策略');
    expect(KNOWLEDGE_PAGE.filterChips.conversion).toBe('转化驱动');
  });

  it('Tab 2 tab trigger 可见(通过 data-testid)', () => {
    renderPage();
    expect(screen.getByTestId('tab-elements')).toBeInTheDocument();
  });

  it('Tab 1 count text 含中间点 ·', () => {
    renderPage();
    expect(screen.getByTestId('script-count')).toHaveTextContent('·');
  });

  it('Tab 2 count text 常量包含 "共 23 大 · 显示 23 个"', () => {
    expect(KNOWLEDGE_PAGE.countText.elements(23, 23)).toBe('共 23 大 · 显示 23 个');
  });

  it('Tab 3 count text 常量包含 "共 23 个公式 · 显示 23 个"', () => {
    expect(KNOWLEDGE_PAGE.countText.opening(23, 23)).toBe('共 23 个公式 · 显示 23 个');
  });
});

describe('Knowledge · 起承转合 footer 字面锁', () => {
  it('footer title 显示 "起承转合 · 文案结构"', () => {
    renderPage();
    expect(screen.getByTestId('story-footer-title')).toHaveTextContent('起承转合 · 文案结构');
  });

  it('stage qi 显示 "起：黄金3秒"', () => {
    renderPage();
    expect(screen.getByTestId('story-stage-label-qi')).toHaveTextContent('起：黄金3秒');
  });

  it('stage cheng 显示 "承：内容发展"', () => {
    renderPage();
    expect(screen.getByTestId('story-stage-label-cheng')).toHaveTextContent('承：内容发展');
  });

  it('stage zhuan 显示 "转：高潮转折"', () => {
    renderPage();
    expect(screen.getByTestId('story-stage-label-zhuan')).toHaveTextContent('转：高潮转折');
  });

  it('stage he 显示 "合：有力结尾"', () => {
    renderPage();
    expect(screen.getByTestId('story-stage-label-he')).toHaveTextContent('合：有力结尾');
  });
});
