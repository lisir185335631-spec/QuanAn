/**
 * MyTopics module unit tests · sally 1:1 复刻版
 * mock-first empty state · 6-8 it 块 · 字面验收 + 交互断言
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MyTopics from '@/pages/modules/MyTopics';

// ── mocks ──────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockToastInfo = vi.fn();

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Grab sonner toast mock after vi.mock
let toastInfoSpy: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  mockNavigate.mockClear();
  mockToastInfo.mockClear();
  const sonnerMod = await import('sonner');
  toastInfoSpy = vi.mocked(sonnerMod.toast.info);
  toastInfoSpy.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── helper ─────────────────────────────────────────────────────────────────────

function renderMyTopics() {
  return render(
    <MemoryRouter>
      <MyTopics />
    </MemoryRouter>,
  );
}

// ── tests ──────────────────────────────────────────────────────────────────────

describe('MyTopics page · sally 1:1 视觉复刻', () => {
  it('返回爆款选题 back link 出现', () => {
    renderMyTopics();
    expect(screen.getByTestId('back-link')).toHaveTextContent('返回爆款选题');
  });

  it('breadcrumb MY TOPICS chip 出现', () => {
    renderMyTopics();
    expect(screen.getByTestId('breadcrumb-chip')).toHaveTextContent('MY TOPICS');
  });

  it('breadcrumb right + h1 我的选题库 出现', () => {
    renderMyTopics();
    expect(screen.getByTestId('breadcrumb-right')).toHaveTextContent('我的选题库');
    expect(screen.getByTestId('h1-title')).toHaveTextContent('我的选题库');
  });

  it('subtitle 关键词 按类型筛选、一键导出和生成文案 出现', () => {
    renderMyTopics();
    expect(screen.getByTestId('subtitle')).toHaveTextContent('按类型筛选、一键导出和生成文案');
  });

  it('6 filter chip label 全出现(全部 / 流量型 / 变现型 / 人设型 / 认知型 / 案例型)', () => {
    renderMyTopics();
    expect(screen.getByTestId('filter-chip-all')).toHaveTextContent('全部');
    expect(screen.getByTestId('filter-chip-traffic')).toHaveTextContent('流量型');
    expect(screen.getByTestId('filter-chip-monetize')).toHaveTextContent('变现型');
    expect(screen.getByTestId('filter-chip-persona')).toHaveTextContent('人设型');
    expect(screen.getByTestId('filter-chip-cognitive')).toHaveTextContent('认知型');
    expect(screen.getByTestId('filter-chip-case')).toHaveTextContent('案例型');
  });

  it('empty state: title + desc + CTA 全出现', () => {
    renderMyTopics();
    expect(screen.getByTestId('empty-title')).toHaveTextContent('还没有收藏任何选题');
    expect(screen.getByTestId('empty-desc')).toHaveTextContent('去爆款选题页面生成选题，点击红心即可收藏');
    expect(screen.getByTestId('empty-cta-btn')).toHaveTextContent('去生成选题');
  });

  it('filter click 切换 · 全部(active)→ 点流量型 → 流量型 active', async () => {
    renderMyTopics();
    const allChip = screen.getByTestId('filter-chip-all');
    const trafficChip = screen.getByTestId('filter-chip-traffic');

    // default: 全部 active
    expect(allChip).toHaveAttribute('aria-pressed', 'true');
    expect(trafficChip).toHaveAttribute('aria-pressed', 'false');

    await act(async () => {
      fireEvent.click(trafficChip);
    });

    expect(allChip).toHaveAttribute('aria-pressed', 'false');
    expect(trafficChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('empty CTA btn click → navigate /step/5', async () => {
    renderMyTopics();
    const ctaBtn = screen.getByTestId('empty-cta-btn');
    await act(async () => {
      fireEvent.click(ctaBtn);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/step/5');
  });
});
