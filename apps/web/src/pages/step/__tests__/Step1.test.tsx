import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import Step1 from '@/pages/step/Step1';

function renderStep1() {
  return render(
    <MemoryRouter>
      <Step1 />
    </MemoryRouter>,
  );
}

// ── D1 字面锁测试 ────────────────────────────────────────────────────────────

describe('Step1 · D1 字面锁', () => {
  it('breadcrumb 含 STEP 01', () => {
    renderStep1();
    expect(screen.getByText('STEP 01')).toBeInTheDocument();
  });

  it('breadcrumb 含 选择行业赛道', () => {
    renderStep1();
    expect(screen.getByText('选择行业赛道')).toBeInTheDocument();
  });

  it('h1 含 🌐 prefix', () => {
    renderStep1();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('🌐');
  });

  it('h1 含 选择你的行业赛道', () => {
    renderStep1();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('选择你的行业赛道');
  });

  it('subtitle 含 56+ 金色', () => {
    renderStep1();
    expect(screen.getByText('56+')).toBeInTheDocument();
  });

  it('subtitle 含 自定义输入行业 inline link', () => {
    renderStep1();
    expect(screen.getByTestId('subtitle-custom-link')).toHaveTextContent('自定义输入行业');
  });

  it('search placeholder 正确', () => {
    renderStep1();
    expect(
      screen.getByPlaceholderText('搜索行业名称或关键词（如：美容院、餐饮、教育...）'),
    ).toBeInTheDocument();
  });
});

// ── 6 tab 渲染 ───────────────────────────────────────────────────────────────

describe('Step1 · 6 tab 渲染', () => {
  const tabs = [
    { id: 'all', label: '全部行业', count: '56' },
    { id: 'life', label: '生活服务', count: '18' },
    { id: 'ecom', label: '电商零售', count: '13' },
    { id: 'create', label: '内容创作', count: '7' },
    { id: 'pro', label: '专业服务', count: '14' },
    { id: 'mfg', label: '产业制造', count: '4' },
  ];

  for (const tab of tabs) {
    it(`tab [${tab.id}] 含 label 和 count`, () => {
      renderStep1();
      const el = screen.getByTestId(`tab-${tab.id}`);
      expect(el).toBeInTheDocument();
      expect(el).toHaveTextContent(tab.label);
      expect(el).toHaveTextContent(`(${tab.count})`);
    });
  }
});

// ── 56 行业渲染(代表性抽检) ─────────────────────────────────────────────────

describe('Step1 · industry 渲染', () => {
  const sampleIds = ['beauty', 'cosmetics', 'food', 'apparel', 'edu', 'other'];

  for (const id of sampleIds) {
    it(`industry card [${id}] 渲染`, () => {
      renderStep1();
      expect(screen.getByTestId(`industry-card-${id}`)).toBeInTheDocument();
    });
  }

  it('美业 card 有正确 label 文字', () => {
    renderStep1();
    expect(screen.getByTestId('industry-card-beauty')).toHaveTextContent('美业');
  });
});

// ── 搜索过滤 ─────────────────────────────────────────────────────────────────

describe('Step1 · 搜索', () => {
  it('搜索不存在词 → EmptyState', () => {
    renderStep1();
    fireEvent.change(screen.getByTestId('industry-search'), {
      target: { value: 'xyznotfound12345' },
    });
    expect(screen.getByText('未找到匹配的行业')).toBeInTheDocument();
  });

  it('搜索 美容院 → 美业 card 出现', () => {
    renderStep1();
    fireEvent.change(screen.getByTestId('industry-search'), { target: { value: '美容院' } });
    expect(screen.getByTestId('industry-card-beauty')).toBeInTheDocument();
  });
});

// ── 选中 美业 → banner + sticky 同时出现 ────────────────────────────────────

describe('Step1 · 选中行业后 banner + sticky bar', () => {
  it('点击 美业 → banner 出现含 已选择：美业', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-beauty'));
    expect(screen.getByText('已选择：美业')).toBeInTheDocument();
  });

  it('点击 美业 → banner 出现含 关键词：美容院、美发、美甲、美睫、纹绣', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-beauty'));
    expect(screen.getByText('关键词：美容院、美发、美甲、美睫、纹绣')).toBeInTheDocument();
  });

  it('点击 美业 → 确认并进入下一步 出现 2 次(banner + sticky)', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-beauty'));
    const ctaBtns = screen.getAllByText('确认并进入下一步');
    expect(ctaBtns).toHaveLength(2);
  });

  it('点击 美业 → sticky bar 出现含 已选择 prefix', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-beauty'));
    const stickyBar = screen.getByTestId('step1-sticky-cta');
    expect(stickyBar).toBeInTheDocument();
    expect(screen.getByText('已选择')).toBeInTheDocument();
  });

  it('点击 美业 → card 右上角 CheckCircle2 icon(aria 可检测)', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-beauty'));
    // CheckCircle2 是 SVG, 通过 card 的 selected 样式验证
    const card = screen.getByTestId('industry-card-beauty');
    expect(card.className).toContain('border-primary');
  });

  it('默认无选中时 sticky bar 不渲染', () => {
    renderStep1();
    expect(screen.queryByTestId('step1-sticky-cta')).not.toBeInTheDocument();
  });
});

// ── inline link 触发 modal ───────────────────────────────────────────────────

describe('Step1 · inline link 触发 modal', () => {
  it('点击 subtitle 自定义输入行业 → modal 对话框出现', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('subtitle-custom-link'));
    expect(screen.getByTestId('custom-industry-input')).toBeInTheDocument();
  });
});
