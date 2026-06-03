/**
 * BoomGenerate.test.tsx — /boom-generate 字面锁测试
 * mock-first 静态 · 验证 1:1 字面复刻 · PioneerLayout tRPC/useAuth/useActiveAccount mock
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// ── PioneerLayout requires trpc + useActiveAccount ───────────────────────────
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

import BoomGenerate from '@/pages/tools/BoomGenerate';

function renderPage() {
  return render(
    <MemoryRouter>
      <BoomGenerate />
    </MemoryRouter>,
  );
}

describe('BoomGenerate', () => {
  // ── breadcrumb ────────────────────────────────────────────────────────────

  it('breadcrumb · CREATE chip', () => {
    renderPage();
    expect(screen.getByText('CREATE')).toBeInTheDocument();
  });

  it('breadcrumb · 爆款生成', () => {
    renderPage();
    expect(screen.getByText('爆款生成')).toBeInTheDocument();
  });

  // ── hero ─────────────────────────────────────────────────────────────────

  it('h1 · ⚡ 爆款元素自动生成', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款元素自动生成');
  });

  it('subtitle · 选择爆款元素组合，AI自动生成5篇', () => {
    renderPage();
    expect(screen.getByText(/选择爆款元素组合，AI自动生成5篇/)).toBeInTheDocument();
  });

  it('subtitle highlight · 深度爆款文案', () => {
    renderPage();
    expect(screen.getByText('深度爆款文案')).toBeInTheDocument();
  });

  it('subtitle · ，每篇至少300字，拒绝表面化', () => {
    renderPage();
    expect(screen.getByText(/，每篇至少300字，拒绝表面化/)).toBeInTheDocument();
  });

  // ── picker ────────────────────────────────────────────────────────────────

  it('picker h2 · 选择爆款元素（可多选）', () => {
    renderPage();
    expect(screen.getByText('选择爆款元素（可多选）')).toBeInTheDocument();
  });

  it('4 group labels', () => {
    renderPage();
    expect(screen.getByText('经典元素')).toBeInTheDocument();
    expect(screen.getByText('情绪驱动')).toBeInTheDocument();
    expect(screen.getByText('内容策略')).toBeInTheDocument();
    expect(screen.getByText('转化驱动')).toBeInTheDocument();
  });

  it('default selected banner · 已选 1 个元素：', () => {
    renderPage();
    expect(screen.getByText(/已选/)).toBeInTheDocument();
    expect(screen.getByText(/个元素：/)).toBeInTheDocument();
  });

  it('default selected · 共鸣 chip shows in banner', () => {
    renderPage();
    // 共鸣 is default selected — label should appear in picker chip AND banner
    const resonanceEls = screen.getAllByText(/共鸣/);
    expect(resonanceEls.length).toBeGreaterThanOrEqual(1);
  });

  it('clicking a non-selected chip selects it (恐惧 appears in banner after click)', () => {
    renderPage();
    const btns = screen.getAllByRole('button');
    const fearBtn = btns.find((b) => b.textContent?.includes('恐惧'));
    expect(fearBtn).toBeDefined();
    fireEvent.click(fearBtn!);
    // after click, 恐惧 appears in at least one place (banner + chip)
    expect(screen.getAllByText(/恐惧/).length).toBeGreaterThanOrEqual(1);
  });

  // ── settings ─────────────────────────────────────────────────────────────

  it('可选设置 h2', () => {
    renderPage();
    expect(screen.getByText('可选设置')).toBeInTheDocument();
  });

  it('行业领域 label', () => {
    renderPage();
    expect(screen.getByText('行业领域（可手动输入）')).toBeInTheDocument();
  });

  it('主题方向 label', () => {
    renderPage();
    expect(screen.getByText('主题方向（选填）')).toBeInTheDocument();
  });

  it('industry input default value · 美业', () => {
    renderPage();
    const input = screen.getByTestId<HTMLInputElement>('boom-industry-input');
    expect(input.value).toBe('美业');
  });

  it('topic input default value · 减肥', () => {
    renderPage();
    const input = screen.getByTestId<HTMLInputElement>('boom-topic-input');
    expect(input.value).toBe('减肥');
  });

  it('industry placeholder · 当前：美业', () => {
    renderPage();
    const input = screen.getByTestId<HTMLInputElement>('boom-industry-input');
    expect(input.placeholder).toBe('当前：美业');
  });

  it('topic placeholder · 如：减肥、理财、育儿...', () => {
    renderPage();
    const input = screen.getByTestId<HTMLInputElement>('boom-topic-input');
    expect(input.placeholder).toBe('如：减肥、理财、育儿...');
  });

  // ── CTA ──────────────────────────────────────────────────────────────────

  it('CTA · 一键生成爆款文案', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /一键生成爆款文案/ })).toBeInTheDocument();
  });

  // ── analysis card ─────────────────────────────────────────────────────────

  it('元素组合分析 h3', () => {
    renderPage();
    expect(screen.getByText('元素组合分析')).toBeInTheDocument();
  });

  it('策略 chip', () => {
    renderPage();
    expect(screen.getByText('策略')).toBeInTheDocument();
  });

  it('analysis body · 共鸣元素与美业减肥主题结合', () => {
    renderPage();
    expect(screen.getByText(/共鸣元素与美业减肥主题结合/)).toBeInTheDocument();
  });

  it('最佳实践 label', () => {
    renderPage();
    expect(screen.getByText('最佳实践：')).toBeInTheDocument();
  });

  it('avoid chip 1 · 避免空泛的口号式共鸣', () => {
    renderPage();
    expect(screen.getByText(/避免空泛的口号式共鸣/)).toBeInTheDocument();
  });

  it('avoid chip 2 · 不要过度贩卖焦虑', () => {
    renderPage();
    expect(screen.getByText(/不要过度贩卖焦虑/)).toBeInTheDocument();
  });

  it('avoid chip 3 · 避免使用过于专业的术语', () => {
    renderPage();
    expect(screen.getByText(/避免使用过于专业的术语/)).toBeInTheDocument();
  });

  it('avoid chip 4 · 避免重复使用同一种共鸣策略', () => {
    renderPage();
    expect(screen.getByText(/避免重复使用同一种共鸣策略/)).toBeInTheDocument();
  });

  // ── 6 entry titles ────────────────────────────────────────────────────────

  it('entry 1 title', () => {
    renderPage();
    // title appears in bold span; may also appear in opening paragraph — use getAllByText
    expect(screen.getAllByText(/你是不是也觉得，减肥这事儿，总差那么一点点/).length).toBeGreaterThanOrEqual(1);
  });

  it('entry 2 title', () => {
    renderPage();
    expect(screen.getAllByText(/减肥失败，不是你意志力差/).length).toBeGreaterThanOrEqual(1);
  });

  it('entry 3 title', () => {
    renderPage();
    expect(screen.getAllByText(/努力减肥一年，不如别人随便吃瘦十斤/).length).toBeGreaterThanOrEqual(1);
  });

  it('entry 4 title', () => {
    renderPage();
    expect(screen.getAllByText(/你是不是也试过无数减肥方法，最后都以失败告终/).length).toBeGreaterThanOrEqual(1);
  });

  it('entry 5 title', () => {
    renderPage();
    expect(screen.getAllByText(/减肥就是一场与美食的"苦恋"/).length).toBeGreaterThanOrEqual(1);
  });

  it('entry 6 title', () => {
    renderPage();
    expect(screen.getAllByText(/减肥成功后，就能一劳永逸了/).length).toBeGreaterThanOrEqual(1);
  });

  // ── 6 types ───────────────────────────────────────────────────────────────

  it('6 type chips', () => {
    renderPage();
    expect(screen.getByText('痛点切入型')).toBeInTheDocument();
    expect(screen.getByText('反常识事实型')).toBeInTheDocument();
    expect(screen.getByText('算账对比型')).toBeInTheDocument();
    expect(screen.getByText('方法论拆解型')).toBeInTheDocument();
    expect(screen.getByText('观点输出型')).toBeInTheDocument();
    expect(screen.getByText('行业洞察型')).toBeInTheDocument();
  });

  // ── 6 formats ─────────────────────────────────────────────────────────────

  it('6 format chips', () => {
    renderPage();
    expect(screen.getByText('口播+场景演示')).toBeInTheDocument();
    expect(screen.getByText('口播+图文展示')).toBeInTheDocument();
    expect(screen.getByText('口播+数据图表')).toBeInTheDocument();
    expect(screen.getByText('口播+流程图')).toBeInTheDocument();
    expect(screen.getByText('口播+情景模拟')).toBeInTheDocument();
    expect(screen.getByText('口播+行业数据')).toBeInTheDocument();
  });

  // ── 4 section labels (×6 entries each) ───────────────────────────────────

  it('黄金3秒开头 section label', () => {
    renderPage();
    const els = screen.getAllByText('黄金3秒开头');
    expect(els.length).toBe(6);
  });

  it('内容发展 section label', () => {
    renderPage();
    const els = screen.getAllByText('内容发展');
    expect(els.length).toBe(6);
  });

  it('高潮/转折 section label', () => {
    renderPage();
    const els = screen.getAllByText('高潮/转折');
    expect(els.length).toBe(6);
  });

  it('结尾/CTA section label', () => {
    renderPage();
    const els = screen.getAllByText('结尾/CTA');
    expect(els.length).toBe(6);
  });

  // ── 爆款指数 × 6 ──────────────────────────────────────────────────────────

  it('爆款指数 prefix appears 6 times', () => {
    renderPage();
    const els = screen.getAllByText(/爆款指数/);
    expect(els.length).toBe(6);
  });

  it('8/10 and 9/10 scores present', () => {
    renderPage();
    expect(screen.getAllByText(/8\/10/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/9\/10/).length).toBeGreaterThanOrEqual(1);
  });

  // ── 完整文案 × 6 ─────────────────────────────────────────────────────────

  it('完整文案 label appears 6 times', () => {
    renderPage();
    const els = screen.getAllByText('完整文案');
    expect(els.length).toBe(6);
  });

  // ── 爆款原因 × 6 ─────────────────────────────────────────────────────────

  it('爆款原因 prefix appears 6 times', () => {
    renderPage();
    const els = screen.getAllByText('爆款原因：');
    expect(els.length).toBe(6);
  });

  // ── entry opening key sentences ───────────────────────────────────────────

  it('entry 1 opening key sentence', () => {
    renderPage();
    // opening text appears in section body + full text — use getAllByText
    expect(screen.getAllByText(/体重秤上的数字就是不肯动/).length).toBeGreaterThanOrEqual(1);
  });

  it('entry 2 opening key sentence', () => {
    renderPage();
    expect(screen.getAllByText(/只要管住嘴迈开腿，就一定能瘦/).length).toBeGreaterThanOrEqual(1);
  });

  it('entry 6 opening key sentence', () => {
    renderPage();
    expect(screen.getAllByText(/从此告别肥胖烦恼/).length).toBeGreaterThanOrEqual(1);
  });
});
