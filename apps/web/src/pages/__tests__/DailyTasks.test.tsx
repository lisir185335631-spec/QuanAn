/**
 * /daily-tasks · 今日行动清单 · unit tests (sally 真实页 mock-first)
 * 静态页 assertion · chip / h1 / subtitle / 4 task / 3 stat / progress / footer
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import DailyTasks from '@/pages/modules/DailyTasks';

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as object), useNavigate: () => mockNavigate };
});

// ── helpers ───────────────────────────────────────────────────────────────────

function renderDailyTasks() {
  return render(
    <MemoryRouter>
      <DailyTasks />
    </MemoryRouter>,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('DailyTasks · sally 真实页 mock-first', () => {
  it('chip / h1 / subtitle 字面锁', () => {
    renderDailyTasks();
    expect(screen.getByTestId('daily-tasks-chip')).toHaveTextContent('每日任务');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('今日行动清单');
    expect(screen.getByText('每天完成具体任务，一步步打造变现IP')).toBeInTheDocument();
  });

  it('4 task title 字面锁', () => {
    renderDailyTasks();
    expect(screen.getByText('复盘已发布内容数据并总结')).toBeInTheDocument();
    expect(screen.getByText('优化下一批内容选题和脚本方向')).toBeInTheDocument();
    expect(screen.getByText('研究对标账号的评论区互动策略')).toBeInTheDocument();
    expect(screen.getByText('进行一次口播训练并录制')).toBeInTheDocument();
  });

  it('3 stat label 字面锁', () => {
    renderDailyTasks();
    expect(screen.getByText('连续打卡天数')).toBeInTheDocument();
    expect(screen.getByText('累计打卡天数')).toBeInTheDocument();
    expect(screen.getByText('累计完成任务')).toBeInTheDocument();
  });

  it('today progress card · 今日进度 + 0/4', () => {
    renderDailyTasks();
    expect(screen.getByTestId('today-progress-card')).toBeInTheDocument();
    expect(screen.getByText('今日进度')).toBeInTheDocument();
    expect(screen.getByText('0/4')).toBeInTheDocument();
  });

  it('footer 2 button 字面锁 + click navigate', () => {
    renderDailyTasks();
    expect(screen.getByTestId('footer-btn-diagnosis')).toHaveTextContent('IP诊断');
    expect(screen.getByTestId('footer-btn-continue')).toHaveTextContent('继续做IP方案');

    fireEvent.click(screen.getByTestId('footer-btn-diagnosis'));
    expect(mockNavigate).toHaveBeenCalledWith('/diagnosis');

    fireEvent.click(screen.getByTestId('footer-btn-continue'));
    expect(mockNavigate).toHaveBeenCalledWith('/step/1');
  });
});
