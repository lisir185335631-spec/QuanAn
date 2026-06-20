import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

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

  it('点击 美业 → card 获得 data-state="active"', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    // IKB 体系选中态通过内联 style 设置边框色,用 data-state 属性判断选中状态
    const card = screen.getByTestId('industry-card-美业');
    expect(card).toHaveAttribute('data-state', 'active');
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

// ── 行业选择持久化 ────────────────────────────────────────────────────────────
// 验证 handleSubmit 在导航前写入 localStorage
// global setup.ts mock: useActiveAccount → account.id = 1
// → LS key = aiip_memory_acc_1_step1
// US-P05: 美业有 subIndustries → 必须先选子行业才能提交

describe('Step1 · 行业选择持久化', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('确认并进入下一步 → localStorage 写入 industry + lastIndustryCategory + lastIndustrySub', () => {
    renderStep1();
    // 选中美业 card
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    // US-P05: 必须先选子行业才能提交(美业有 subIndustries)
    // 通过网格点选子行业 beauty_salon(美容院)
    fireEvent.click(screen.getByTestId('sub-industry-chip-beauty_salon'));
    // 点击 sticky bar 的确认按钮
    const ctaBtns = screen.getAllByText('确认并进入下一步');
    fireEvent.click(ctaBtns[0]!);
    // 验证 localStorage 写入正确的 key + 内容
    const raw = localStorage.getItem('aiip_memory_acc_1_step1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as { industry?: string; lastIndustryCategory?: string; lastIndustrySub?: string };
    expect(parsed.industry).toBe('美业');
    expect(parsed.lastIndustryCategory).toBe('beauty');
    expect(parsed.lastIndustrySub).toBe('beauty_salon');
  });
});

// ── US-P05: 子行业两层选择 ────────────────────────────────────────────────────

describe('Step1 · US-P05 子行业两层选择', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('AC-1: 选美业 → 子行业区块出现(含下拉框 + 网格)', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    // 下拉框存在
    expect(screen.getByTestId('sub-industry-select')).toBeInTheDocument();
    // 网格存在
    expect(screen.getByTestId('sub-industry-grid')).toBeInTheDocument();
  });

  it('AC-1: 子行业网格含 ≥3 个选项', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    const grid = screen.getByTestId('sub-industry-grid');
    const chips = grid.querySelectorAll('button');
    expect(chips.length).toBeGreaterThanOrEqual(3);
  });

  it('AC-1: 下拉框含目标 option', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    const select = screen.getByTestId('sub-industry-select') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('beauty_salon');
    expect(options).toContain('hair');
    expect(options).toContain('other');
  });

  it('AC-1: 网格点选子行业 → data-state active', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    fireEvent.click(screen.getByTestId('sub-industry-chip-hair'));
    expect(screen.getByTestId('sub-industry-chip-hair')).toHaveAttribute('data-state', 'active');
  });

  it('AC-1: 下拉框选择子行业 → 网格对应项 active', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    fireEvent.change(screen.getByTestId('sub-industry-select'), { target: { value: 'nail' } });
    expect(screen.getByTestId('sub-industry-chip-nail')).toHaveAttribute('data-state', 'active');
  });

  it('AC-3: 只选大类未选子行业点下一步 → 提示"请选择子行业"', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    // 不选子行业，直接点提交
    const ctaBtns = screen.getAllByText('确认并进入下一步');
    fireEvent.click(ctaBtns[0]!);
    // 错误提示出现
    expect(screen.getByTestId('sub-industry-error')).toHaveTextContent('请选择子行业');
    // localStorage 未写入
    expect(localStorage.getItem('aiip_memory_acc_1_step1')).toBeNull();
  });

  it('AC-4: 选大类+子行业后提交 → localStorage 含 lastIndustryCategory + lastIndustrySub', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    fireEvent.click(screen.getByTestId('sub-industry-chip-lash'));
    const ctaBtns = screen.getAllByText('确认并进入下一步');
    fireEvent.click(ctaBtns[0]!);
    const raw = localStorage.getItem('aiip_memory_acc_1_step1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as { lastIndustryCategory?: string; lastIndustrySub?: string };
    expect(parsed.lastIndustryCategory).toBe('beauty');
    expect(parsed.lastIndustrySub).toBe('lash');
  });

  it('切换大类 → 子行业选择重置', () => {
    renderStep1();
    fireEvent.click(screen.getByTestId('industry-card-美业'));
    fireEvent.click(screen.getByTestId('sub-industry-chip-hair'));
    // 切换到餐饮美食
    fireEvent.click(screen.getByTestId('industry-card-餐饮美食'));
    // 新行业的子行业区块出现
    expect(screen.getByTestId('sub-industry-grid')).toBeInTheDocument();
    // 没有上一个行业的子行业网格
    expect(screen.queryByTestId('sub-industry-chip-hair')).not.toBeInTheDocument();
    // 美业子行业 chip 不在
    expect(screen.queryByTestId('sub-industry-chip-beauty_salon')).not.toBeInTheDocument();
  });
});
