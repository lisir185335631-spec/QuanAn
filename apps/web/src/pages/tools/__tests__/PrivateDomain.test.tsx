/**
 * PrivateDomain.test.tsx — mock-first · 字面锁断言
 * 旧 trpc.privateDomain.generate 版整体重写
 * (PRD-29.13 已把 /private-domain 克隆为 mock-first · 此前 trpc 旧测试未同步 → 6 fail)
 * 断言 h1 / 副标题 / 6 scenario tab / 默认 scenario 卡 / 表单默认值 / CTA / 输出 mock / 关键指标 / 复制+反馈
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import PrivateDomain from '@/pages/tools/PrivateDomain';

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <PrivateDomain />
    </MemoryRouter>,
  );
}

describe('PrivateDomain', () => {
  it('h1 字面锁 "私域成交流程"', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('私域成交流程');
  });

  it('副标题字面锁', () => {
    renderPage();
    expect(
      screen.getByText('覆盖从加好友到成交复购的全链路话术，让私域转化率翻倍'),
    ).toBeInTheDocument();
  });

  it('6 scenario tab 名称', () => {
    renderPage();
    // 当前 active(欢迎话术)同时出现在 tab + scenario 卡 → getAllByText
    ['欢迎话术', '破冰暖场', '信任建立', '需求挖掘', '成交话术', '售后跟进'].forEach((name) => {
      expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('默认 scenario 卡 · 欢迎话术 subtitle', () => {
    renderPage();
    expect(screen.getByText('新好友添加后的第一印象话术')).toBeInTheDocument();
  });

  it('表单 label + 默认值预填', () => {
    renderPage();
    expect(screen.getByText('产品/服务名称')).toBeInTheDocument();
    expect(screen.getByText('目标用户')).toBeInTheDocument();
    expect(screen.getByText('具体场景')).toBeInTheDocument();
    expect(screen.getByDisplayValue('护肤套装')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25-35宝妈')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('客户看了朋友圈后主动咨询、老客户3个月没复购'),
    ).toBeInTheDocument();
  });

  it('CTA "生成话术" 可见且默认 enabled', () => {
    renderPage();
    const btn = screen.getByRole('button', { name: /生成话术/ });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('输出 section mock 字面', () => {
    renderPage();
    expect(screen.getAllByText(/25岁后皮肤开始走下坡路/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/价格太贵了/).length).toBeGreaterThanOrEqual(1);
  });

  it('关键指标 + 5 指标字面', () => {
    renderPage();
    expect(screen.getByText('关键指标')).toBeInTheDocument();
    ['私域好友添加率', '咨询转化率', '老客户复购率', '客单价', '客户好评率'].forEach((m) => {
      expect(screen.getAllByText(m).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('复制全部话术 + 反馈 prompt', () => {
    renderPage();
    expect(screen.getByText(/复制全部话术/)).toBeInTheDocument();
    expect(screen.getByText('这个结果对你有帮助吗？')).toBeInTheDocument();
  });
});
