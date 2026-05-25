/**
 * /ip-plan · 我的IP方案 · unit tests (sally 1:1 复刻 · mock-first)
 * 断言 h1 / 副标 / 进度 / 9 step title / 查看详情 / 去完成 / 底部 CTA / navigate
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import IpPlan from '@/pages/IpPlan';

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ── helper ────────────────────────────────────────────────────────────────────

function renderIpPlan() {
  return render(
    <MemoryRouter>
      <IpPlan />
    </MemoryRouter>,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('IpPlan · sally 1:1 复刻', () => {
  it('h1 · 我的IP方案 字面锁', () => {
    renderIpPlan();
    expect(screen.getByTestId('ip-plan-h1')).toHaveTextContent('我的IP方案');
  });

  it('副标 · 已完成 4／9 步 全角斜杠 字面锁', () => {
    renderIpPlan();
    expect(screen.getByTestId('ip-plan-subtitle')).toHaveTextContent('已完成 4／9 步');
  });

  it('进度 card · IP打造进度 + 44% 字面锁', () => {
    renderIpPlan();
    expect(screen.getByTestId('ip-plan-progress-label')).toHaveTextContent('IP打造进度');
    expect(screen.getByTestId('ip-plan-progress-percent')).toHaveTextContent('44%');
  });

  it('9 step title 全部渲染', () => {
    renderIpPlan();
    const titles = [
      '行业选择', '账号包装', '人设定制', '执行计划',
      '变现路径', '爆款选题', '拍摄计划', '文案生成', '直播策划',
    ];
    titles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('查看详情 4 次 · 去完成 5 次', () => {
    renderIpPlan();
    expect(screen.getAllByText('查看详情')).toHaveLength(4);
    expect(screen.getAllByText('去完成')).toHaveLength(5);
  });

  it('底部 CTA · 还有 5 步未完成 + 继续下一步', () => {
    renderIpPlan();
    expect(screen.getByTestId('ip-plan-footer-text')).toHaveTextContent(
      '还有 5 步未完成，继续打造你的IP吧！',
    );
    expect(screen.getByTestId('ip-plan-next-btn')).toHaveTextContent('继续下一步');
  });

  it('点 继续下一步 navigate 到 /step/4b(第一个未完成)', () => {
    renderIpPlan();
    const btn = screen.getByTestId('ip-plan-next-btn');
    fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/step/4b');
  });

  it('step1 extra · 已选择行业：other 全角冒号', () => {
    renderIpPlan();
    expect(screen.getByTestId('ip-plan-step-extra-step1')).toHaveTextContent('已选择行业：other');
  });
});
