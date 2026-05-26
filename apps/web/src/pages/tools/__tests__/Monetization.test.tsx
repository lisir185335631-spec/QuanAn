/**
 * Monetization.test.tsx — mock-first · 字面锁断言
 * 删 trpc.monetization.generate mock · 断言 h1 / subtitle / 4 label / 4 default value
 * + MONETIZATION_MOCK 字面命中(≥10 个)
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Monetization from '@/pages/tools/Monetization';
import {
  MONETIZATION_CTA,
  MONETIZATION_DEFAULT_AUDIENCE,
  MONETIZATION_DEFAULT_POSITIONING,
  MONETIZATION_DEFAULT_PRODUCT,
  MONETIZATION_FEEDBACK_PROMPT,
  MONETIZATION_FORM_TITLE,
  MONETIZATION_H1,
  MONETIZATION_LABEL_AUDIENCE,
  MONETIZATION_LABEL_INDUSTRY,
  MONETIZATION_LABEL_POSITIONING,
  MONETIZATION_LABEL_PRODUCT,
  MONETIZATION_RESULT_TITLE,
  MONETIZATION_SUBTITLE,
} from '@/lib/constants/monetization';

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <Monetization />
    </MemoryRouter>,
  );
}

describe('Monetization', () => {
  it('h1 字面锁 "IP变现模型定制"', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(MONETIZATION_H1);
  });

  it('subtitle 字面锁', () => {
    renderPage();
    expect(screen.getByText(MONETIZATION_SUBTITLE)).toBeInTheDocument();
  });

  it('form card h2 "基本信息"', () => {
    renderPage();
    expect(screen.getByText(MONETIZATION_FORM_TITLE)).toBeInTheDocument();
  });

  it('result card h2 "IP变现模型"', () => {
    renderPage();
    // heading level 2 — 两个 h2 都在 · 按 name 匹配 result h2
    expect(screen.getByRole('heading', { level: 2, name: MONETIZATION_RESULT_TITLE })).toBeInTheDocument();
  });

  it('4 个 label 字面锁', () => {
    renderPage();
    expect(screen.getByText(MONETIZATION_LABEL_INDUSTRY)).toBeInTheDocument();
    // label 含红星 · 用 getByText 匹配 label element text(不含 * span)
    expect(screen.getByText((text) => text.startsWith(MONETIZATION_LABEL_PRODUCT))).toBeInTheDocument();
    expect(screen.getByText(MONETIZATION_LABEL_AUDIENCE)).toBeInTheDocument();
    expect(screen.getByText(MONETIZATION_LABEL_POSITIONING)).toBeInTheDocument();
  });

  it('4 个 default value prefilled', () => {
    renderPage();
    // product textarea
    expect(screen.getByDisplayValue(MONETIZATION_DEFAULT_PRODUCT)).toBeInTheDocument();
    // audience input
    expect(screen.getByDisplayValue(MONETIZATION_DEFAULT_AUDIENCE)).toBeInTheDocument();
    // positioning input
    expect(screen.getByDisplayValue(MONETIZATION_DEFAULT_POSITIONING)).toBeInTheDocument();
    // industry dropdown button 显示 "自媒体运营"
    expect(screen.getByText(/自媒体运营/)).toBeInTheDocument();
  });

  it('CTA 按钮 "生成变现模型" 可见', () => {
    renderPage();
    expect(screen.getByRole('button', { name: MONETIZATION_CTA })).toBeInTheDocument();
  });

  it('反馈 prompt "这个结果对你有帮助吗？"', () => {
    renderPage();
    expect(screen.getByText(MONETIZATION_FEEDBACK_PROMPT)).toBeInTheDocument();
  });

  // MONETIZATION_MOCK 字面命中 — ≥10 条
  it('MOCK 字面 · 职场英语口语技巧', () => {
    renderPage();
    expect(screen.getByText(/职场英语口语技巧/)).toBeInTheDocument();
  });

  it('MOCK 字面 · 引流产品', () => {
    renderPage();
    expect(screen.getByText(/引流产品/)).toBeInTheDocument();
  });

  it('MOCK 字面 · 信任产品', () => {
    renderPage();
    expect(screen.getByText(/信任产品/)).toBeInTheDocument();
  });

  it('MOCK 字面 · 利润产品', () => {
    renderPage();
    expect(screen.getByText(/利润产品/)).toBeInTheDocument();
  });

  it('MOCK 字面 · 后端产品', () => {
    renderPage();
    expect(screen.getByText(/后端产品/)).toBeInTheDocument();
  });

  it('MOCK 字面 · 李叫兽', () => {
    renderPage();
    expect(screen.getByText(/李叫兽/)).toBeInTheDocument();
  });

  it('MOCK 字面 · 秋叶大叔', () => {
    renderPage();
    expect(screen.getByText(/秋叶大叔/)).toBeInTheDocument();
  });

  it('MOCK 字面 · IP启动与引流', () => {
    renderPage();
    expect(screen.getByText(/IP启动与引流/)).toBeInTheDocument();
  });

  it('MOCK 字面 · 职场英语高频词汇包', () => {
    renderPage();
    expect(screen.getByText(/职场英语高频词汇包/)).toBeInTheDocument();
  });

  it('MOCK 字面 · 商务邮件写作精讲', () => {
    renderPage();
    expect(screen.getByText(/商务邮件写作精讲/)).toBeInTheDocument();
  });
});
