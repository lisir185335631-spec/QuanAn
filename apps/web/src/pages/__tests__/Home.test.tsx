/**
 * Home page unit tests — 1:1 复刻 mock-first
 * Tests: 7 大字面锁 / 9 step label / 4 stat / 15 card title / 6 workflow step / footer
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

  it('hero brand: POWERED BY ADVANCED AI · FULL-CHAIN INTELLIGENT ACCELERATION', () => {
    renderHome();
    expect(screen.getByText(/POWERED BY ADVANCED AI · FULL-CHAIN INTELLIGENT ACCELERATION/)).toBeTruthy();
  });

  it('progress title: 我的IP打造进度', () => {
    renderHome();
    expect(screen.getByText('我的IP打造进度')).toBeTruthy();
  });

  it('progress subtitle: 恭喜！全部流程已完成', () => {
    renderHome();
    expect(screen.getByText(/恭喜！全部流程已完成/)).toBeTruthy();
  });

  it('progress view plan: 查看IP方案', () => {
    renderHome();
    expect(screen.getByText(/查看IP方案/)).toBeTruthy();
  });

  it('progress overall: 总体进度', () => {
    renderHome();
    expect(screen.getByText('总体进度')).toBeTruthy();
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

describe('Home page — 4 stats', () => {
  it('stat: 覆盖行业 + 56+', () => {
    renderHome();
    expect(screen.getByText('覆盖行业')).toBeTruthy();
    expect(screen.getByText('56+')).toBeTruthy();
  });
  it('stat: 爆款元素 + 22', () => {
    renderHome();
    expect(screen.getByText('爆款元素')).toBeTruthy();
    expect(screen.getByText('22')).toBeTruthy();
  });
  it('stat: 脚本类型 + 20', () => {
    renderHome();
    expect(screen.getByText('脚本类型')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
  });
  it('stat: 平台覆盖 + 5', () => {
    renderHome();
    expect(screen.getByText('平台覆盖')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });
});

describe('Home page — FUNCTION MATRIX', () => {
  it('section title: FUNCTION MATRIX', () => {
    renderHome();
    expect(screen.getByText('FUNCTION MATRIX')).toBeTruthy();
  });
  it('subtitle: 全链路功能矩阵 · 洞察市场 → 设计变现 → 创作内容 → 智能工具', () => {
    renderHome();
    expect(
      screen.getByText(/全链路功能矩阵 · 洞察市场 → 设计变现 → 创作内容 → 智能工具/),
    ).toBeTruthy();
  });
  it('group: 市场洞察', () => { renderHome(); expect(screen.getByText('市场洞察')).toBeTruthy(); });
  it('group: 变现设计', () => { renderHome(); expect(screen.getByText('变现设计')).toBeTruthy(); });
  it('group: 内容创作', () => { renderHome(); expect(screen.getByText('内容创作')).toBeTruthy(); });
  it('group: 智能工具', () => { renderHome(); expect(screen.getByText('智能工具')).toBeTruthy(); });

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
  it('section title: WORKFLOW', () => {
    renderHome();
    expect(screen.getByText('WORKFLOW')).toBeTruthy();
  });
  it('subtitle: 按照流程从零到一打造你的短视频变现体系', () => {
    renderHome();
    expect(screen.getByText('按照流程从零到一打造你的短视频变现体系')).toBeTruthy();
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
      expect(screen.getByText(num)).toBeTruthy();
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
  it('footer: AIP AGENT · AI FULL-CHAIN IP MONETIZATION ENGINE', () => {
    renderHome();
    expect(
      screen.getByText('AIP AGENT · AI FULL-CHAIN IP MONETIZATION ENGINE'),
    ).toBeTruthy();
  });
});
