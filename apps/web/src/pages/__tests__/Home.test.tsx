/**
 * Home page unit tests — 红蓝紫 IKB 重设计后内容锁(PR #11 重做 hero/sections 后对齐)
 * 锁:hero(chip/副标题/brand)· progress(标题/查看方案/100%)· 9 step
 *    · 4 stat 标签 · FUNCTION MATRIX(标题/4 分组/15 卡片)· WORKFLOW(标题/6 step)· READY/页脚
 * 注:① stat 数值由 CountUp 动画驱动(jsdom useInView=false 时停在 0),故只锁标签
 *    ② workflow 编号 01/02… 在 progress 步骤 / matrix 分组也出现,用 getAllByText
 *    ③ 旧版的 progress 副标题/总体进度、matrix/workflow 副标题在重设计中已移除,相应断言删除
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import Home from '@/pages/Home';

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('Home page — 字面锁', () => {
  it('hero chip: SYSTEM ONLINE · AIP全案获客操盘手', () => {
    renderHome();
    expect(screen.getByText(/SYSTEM ONLINE · AIP全案获客操盘手/)).toBeTruthy();
  });

  it('hero subtitle: OPC全案落地 · 从流量到成交 · AI+短视频+IP · 全链路变现', () => {
    renderHome();
    expect(screen.getByText(/OPC全案落地 · 从流量到成交 · AI\+短视频\+IP · 全链路变现/)).toBeTruthy();
  });

  it('hero brand: 全链路 · 智能加速', () => {
    renderHome();
    expect(screen.getByText(/全链路 · 智能加速/)).toBeTruthy();
  });

  it('progress title: 我的IP打造进度', () => {
    renderHome();
    expect(screen.getByText('我的IP打造进度')).toBeTruthy();
  });

  it('progress view plan: 查看IP方案', () => {
    renderHome();
    expect(screen.getByText(/查看IP方案/)).toBeTruthy();
  });

  it('progress percent: 100%', () => {
    renderHome();
    expect(screen.getByText('100%')).toBeTruthy();
  });
});

describe('Home page — 9 step labels', () => {
  const stepLabels = [
    '选择行业',
    '账号包装',
    '人设定制',
    '执行计划',
    '变现路径',
    '爆款选题',
    '拍摄计划',
    '文案生成',
    '直播策划',
  ];
  stepLabels.forEach((label) => {
    it(`step label: ${label}`, () => {
      renderHome();
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Home page — 4 stats(标签锁;数值 CountUp 动画不锁)', () => {
  const statLabels = ['覆盖行业', '爆款元素', '脚本类型', '平台覆盖'];
  statLabels.forEach((label) => {
    it(`stat label: ${label}`, () => {
      renderHome();
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Home page — FUNCTION MATRIX', () => {
  it('section title: 全链路功能矩阵', () => {
    renderHome();
    expect(screen.getByText('全链路功能矩阵')).toBeTruthy();
  });
  it('group: 市场洞察', () => {
    renderHome();
    expect(screen.getByText('市场洞察')).toBeTruthy();
  });
  it('group: 变现设计', () => {
    renderHome();
    expect(screen.getByText('变现设计')).toBeTruthy();
  });
  it('group: 内容创作', () => {
    renderHome();
    expect(screen.getByText('内容创作')).toBeTruthy();
  });
  it('group: 智能工具', () => {
    renderHome();
    expect(screen.getByText('智能工具')).toBeTruthy();
  });

  const cardTitles = [
    '全网爆款库',
    '爆款文案解析',
    '爆款呈现形式',
    'IP变现模型',
    '私域成交流程',
    '爆款元素生成',
    'AI智能生成',
    '文案结构分析',
    '短视频制作',
    '获客型视频',
    '一键生成视频',
    '语音对话',
    '深度学习',
    '方法论知识库',
    '使用说明',
  ];
  cardTitles.forEach((title) => {
    it(`card title: ${title}`, () => {
      renderHome();
      // Use getAllByText to handle cases where the same text appears in multiple elements
      expect(screen.getAllByText(title).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Home page — WORKFLOW', () => {
  it('section title: 从 0 到变现的全流程', () => {
    renderHome();
    expect(screen.getByText('从 0 到变现的全流程')).toBeTruthy();
  });
  const workflowSteps = [
    { num: '01', title: '选择行业' },
    { num: '02', title: '制定变现' },
    { num: '03', title: '抓取爆款' },
    { num: '05', title: '创作文案' },
    { num: '06', title: '制作视频' },
    { num: '07', title: '私域成交' },
  ];
  workflowSteps.forEach(({ num, title }) => {
    it(`workflow step ${num}: ${title}`, () => {
      renderHome();
      // 编号 01/02… 在 progress 步骤序号 / matrix 分组序号也出现,用 getAllByText
      expect(screen.getAllByText(num).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(title).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Home page — READY TO START + footer', () => {
  it('READY TO START?', () => {
    renderHome();
    expect(screen.getByText('READY TO START?')).toBeTruthy();
  });
  it('subtitle: 愿无知者有力，愿有力者前行', () => {
    renderHome();
    expect(screen.getByText(/愿无知者有力，愿有力者前行/)).toBeTruthy();
  });
  it('CTA: 立即启动', () => {
    renderHome();
    expect(screen.getByText(/立即启动/)).toBeTruthy();
  });
  it('footer brand: AI Full-Chain IP Monetization Engine', () => {
    renderHome();
    expect(screen.getByText('AI Full-Chain IP Monetization Engine')).toBeTruthy();
  });
});
