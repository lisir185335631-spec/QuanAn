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
    // H1 文本为 "STEP 01 · 选择你的行业赛道"，用 regex 匹配子串
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/STEP 01/);
  });

  it('breadcrumb 含 选择你的行业赛道', () => {
    renderStep1();
    // H1 文本为 "STEP 01 · 选择你的行业赛道"
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('选择你的行业赛道');
  });

  it('h1 含 STEP 01 · 前缀', () => {
    renderStep1();
    // 先锋白迁移后 H1 无 emoji，改为验证 STEP 01 前缀存在
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/STEP 01/);
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
// 先锋白迁移后 data-testid 改为 industry-card-${ind.label}(中文标签),不再是 id

describe('Step1 · industry 渲染', () => {
  const sampleCards = [
    { testid: 'industry-card-美业',     label: '美业' },
    { testid: 'industry-card-美妆护肤', label: '美妆护肤' },
    { testid: 'industry-card-餐饮美食', label: '餐饮美食' },
    { testid: 'industry-card-服装穿搭', label: '服装穿搭' },
    { testid: 'industry-card-教育培训', label: '教育培训' },
    { testid: 'industry-card-其他行业', label: '其他行业' },
  ];

  for (const { testid } of sampleCards) {
    it(`industry card [${testid}] 渲染`, () => {
      renderStep1();
      expect(screen.getByTestId(testid)).toBeInTheDocument();
    });
  }

  it('美业 card 有正确 label 文字', () => {
    renderStep1();
    expect(screen.getByTestId('industry-card-美业')).toHaveTextContent('美业');
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
    expect(screen.getByTestId('industry-card-美业')).toBeInTheDocument();
  });
});

// ── 选中 美业 → sticky bar 出现 ──────────────────────────────────────────────

describe('Step1 · 选中行业后 banner + sticky bar', () => {
  it('点击 美业 → sticky bar 出现含 已选择:', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    // sticky bar 内有 "已选择:" 文字节点（来自 <span className="text-[14px] text-[#444653]">）
    expect(screen.getByText('已选择:')).toBeInTheDocument();
  });

  it('点击 美业 → sticky bar 内显示行业名 美业', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    // 已选择的行业名显示在 sticky bar 的 pill 中
    // getAllByText 防止 card 本身文字与 sticky bar 重复
    const labels = screen.getAllByText('美业');
    // card 1 个 + sticky pill 1 个 = 至少 2 个
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  it('点击 美业 → 确认并进入下一步 出现 2 次(header + sticky)', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    const ctaBtns = screen.getAllByText('确认并进入下一步');
    expect(ctaBtns).toHaveLength(2);
  });

  it('点击 美业 → sticky bar 出现含 已选择 prefix', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    // sticky bar 的标签文字
    expect(screen.getByText('已选择:')).toBeInTheDocument();
  });

  it('点击 美业 → card 选中样式包含 border-[#002fa7]', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    // 先锋白迁移后选中态使用 border-[#002fa7] 替代 border-primary
    const card = screen.getByTestId('industry-card-美业');
    expect(card.className).toContain('border-[#002fa7]');
  });

  it('默认无选中时 sticky bar 不渲染', () => {
    renderStep1();
    // sticky bar 仅在有选中时渲染，默认不应有 "已选择:" 文字
    expect(screen.queryByText('已选择:')).not.toBeInTheDocument();
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
