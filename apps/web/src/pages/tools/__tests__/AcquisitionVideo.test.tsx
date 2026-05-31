/**
 * AcquisitionVideo.test.tsx — mock-first · 字面锁断言
 * 旧 trpc.acquisitionVideo.generate 版整体重写
 * (PRD-29.17 已把 /acquisition-video 克隆为 mock-first · 此前 trpc 旧测试未同步 → 8 fail)
 * 断言 h1 / 副标题 / form 标题+label / 默认值 / 行业默认 / CTA / JSON 字面输出 / 反馈
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  ACQUISITION_VIDEO_CTA_GENERATE,
  ACQUISITION_VIDEO_CUSTOMER_LABEL,
  ACQUISITION_VIDEO_FOOTER_FEEDBACK,
  ACQUISITION_VIDEO_FORM_TITLE,
  ACQUISITION_VIDEO_H1,
  ACQUISITION_VIDEO_INDUSTRY_LABEL,
  ACQUISITION_VIDEO_OUTPUT_TITLE,
  ACQUISITION_VIDEO_PRODUCT_LABEL,
  ACQUISITION_VIDEO_SUBTITLE,
} from '@/lib/constants/acquisition-video';
import AcquisitionVideo from '@/pages/tools/AcquisitionVideo';

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AcquisitionVideo />
    </MemoryRouter>,
  );
}

describe('AcquisitionVideo', () => {
  it('h1 字面锁', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(ACQUISITION_VIDEO_H1);
  });

  it('副标题字面锁', () => {
    renderPage();
    expect(screen.getByText(ACQUISITION_VIDEO_SUBTITLE)).toBeInTheDocument();
  });

  it('form 标题 + 3 label', () => {
    renderPage();
    expect(screen.getByText(ACQUISITION_VIDEO_FORM_TITLE)).toBeInTheDocument();
    expect(screen.getByText(ACQUISITION_VIDEO_INDUSTRY_LABEL)).toBeInTheDocument();
    // 客户/产品 label 后接红星 span · 直接文本节点(规范化后)仍等于 label
    expect(screen.getByText(ACQUISITION_VIDEO_CUSTOMER_LABEL)).toBeInTheDocument();
    expect(screen.getByText(ACQUISITION_VIDEO_PRODUCT_LABEL)).toBeInTheDocument();
  });

  it('默认值预填 · 行业 美业 + 客户画像 + 产品亮点', () => {
    renderPage();
    expect(screen.getByDisplayValue('💅 美业')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('想要创业的3-45岁宝妈群体，有一定积蓄但缺乏方向'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('零基础可学、3个月回本、一对一指导')).toBeInTheDocument();
  });

  it('CTA 可见且默认 enabled(默认值非空)', () => {
    renderPage();
    const btn = screen.getByRole('button', { name: ACQUISITION_VIDEO_CTA_GENERATE });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('右栏输出标题 + JSON 字面 mock', () => {
    renderPage();
    expect(screen.getByText(ACQUISITION_VIDEO_OUTPUT_TITLE)).toBeInTheDocument();
    expect(screen.getByText(/美业新手创业秘籍/)).toBeInTheDocument();
    expect(screen.getByText(/30岁宝妈，辞职3个月/)).toBeInTheDocument();
  });

  it('反馈 prompt', () => {
    renderPage();
    expect(screen.getByText(ACQUISITION_VIDEO_FOOTER_FEEDBACK)).toBeInTheDocument();
  });
});
