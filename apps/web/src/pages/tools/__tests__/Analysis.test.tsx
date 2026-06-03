/**
 * Analysis.test.tsx — mock-first · 字面锁断言
 * 旧 trpc.analysis.analyze 版整体重写 → 断言 h1 / subtitle / 默认 797 字 / 综合评分 /
 * 多维度 / 起承转合 / 爆款元素 / 优点不足 / 优化建议 / 反馈
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  ANALYSIS_CONS,
  ANALYSIS_CTA,
  ANALYSIS_DEFAULT_COPY,
  ANALYSIS_DIMENSIONS,
  ANALYSIS_DIMENSIONS_TITLE,
  ANALYSIS_ELEMENTS,
  ANALYSIS_ELEMENTS_TITLE,
  ANALYSIS_FEEDBACK_PROMPT,
  ANALYSIS_H1,
  ANALYSIS_OVERALL_LABEL,
  ANALYSIS_OVERALL_SCORE,
  ANALYSIS_PROS,
  ANALYSIS_STRUCTURE,
  ANALYSIS_STRUCTURE_TITLE,
  ANALYSIS_SUBTITLE,
  ANALYSIS_SUGGESTIONS,
  ANALYSIS_SUGGESTIONS_TITLE,
} from '@/lib/constants/analysis';
import Analysis from '@/pages/tools/Analysis';

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

// PioneerLayout uses useAuth + useActiveAccount → both call trpc → mock at module level
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn(), refetch: vi.fn() }),
}));
vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({ account: null, switchTo: vi.fn(), isSwitching: false, isLoading: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <Analysis />
    </MemoryRouter>,
  );
}

describe('Analysis', () => {
  it('h1 字面锁 "文案结构分析"', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(ANALYSIS_H1);
  });

  it('subtitle 字面锁', () => {
    renderPage();
    expect(screen.getByText(ANALYSIS_SUBTITLE)).toBeInTheDocument();
  });

  it('默认文案 prefilled + 计数器 797 字', () => {
    renderPage();
    // 多行字符串用 toHaveValue 精确比对(getByDisplayValue 会规范化换行致 mismatch)
    expect(screen.getByRole('textbox')).toHaveValue(ANALYSIS_DEFAULT_COPY);
    expect(screen.getByText(`${ANALYSIS_DEFAULT_COPY.length} 字`)).toBeInTheDocument();
  });

  it('CTA "开始分析" 可见', () => {
    renderPage();
    expect(screen.getByRole('button', { name: ANALYSIS_CTA })).toBeInTheDocument();
  });

  it('综合评分 label + 92', () => {
    renderPage();
    // "综合评分" 出现在 h3 + 雷达图 label + legend → getAllByText
    expect(screen.getAllByText(ANALYSIS_OVERALL_LABEL).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(String(ANALYSIS_OVERALL_SCORE)).length).toBeGreaterThanOrEqual(1);
  });

  it('多维度评分 title + 5 维度 label', () => {
    renderPage();
    // "多维度评分" 出现在 h3 + 雷达图 legend → getAllByText
    expect(screen.getAllByText(ANALYSIS_DIMENSIONS_TITLE).length).toBeGreaterThanOrEqual(1);
    ANALYSIS_DIMENSIONS.forEach((d) => {
      // 维度 label 同时出现在雷达图 SVG 和 score bar → getAllByText
      expect(screen.getAllByText(d.label).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('结构拆解 title + 起承转合 4 stage', () => {
    renderPage();
    expect(screen.getByText(ANALYSIS_STRUCTURE_TITLE)).toBeInTheDocument();
    ANALYSIS_STRUCTURE.forEach((s) => {
      expect(screen.getByText(s.stage)).toBeInTheDocument();
    });
  });

  it('识别到的爆款元素 title + 10 chip 字面', () => {
    renderPage();
    expect(screen.getByText(ANALYSIS_ELEMENTS_TITLE)).toBeInTheDocument();
    ANALYSIS_ELEMENTS.forEach((e) => {
      // "提出问题，制造悬念" 同时是 起.type → getAllByText 容忍多命中
      expect(screen.getAllByText(e).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('优点 6 条字面', () => {
    renderPage();
    ANALYSIS_PROS.forEach((p) => {
      expect(screen.getByText(p)).toBeInTheDocument();
    });
  });

  it('不足 2 条字面', () => {
    renderPage();
    ANALYSIS_CONS.forEach((c) => {
      expect(screen.getByText(c)).toBeInTheDocument();
    });
  });

  it('优化建议 title + 3 条字面', () => {
    renderPage();
    // "优化建议" 出现在 section h3 + KPI badge → getAllByText
    expect(screen.getAllByText(ANALYSIS_SUGGESTIONS_TITLE).length).toBeGreaterThanOrEqual(1);
    ANALYSIS_SUGGESTIONS.forEach((s) => {
      expect(screen.getByText(s)).toBeInTheDocument();
    });
  });

  it('反馈 prompt "这个结果对你有帮助吗？"', () => {
    renderPage();
    expect(screen.getByText(ANALYSIS_FEEDBACK_PROMPT)).toBeInTheDocument();
  });
});
