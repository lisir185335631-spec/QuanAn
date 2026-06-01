import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Step3 from '@/pages/step/Step3';

const mockToastInfo = vi.hoisted(() => vi.fn());
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: mockToastInfo,
  },
}));

const mockGenerateMutate = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      get: { useQuery: () => ({ data: null, isLoading: false, isError: false, error: null, refetch: vi.fn() }) },
      save: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    step3: {
      generatePackage: {
        useMutation: (opts?: { onSuccess?: () => void; onError?: (err: { message: string }) => void }) => ({
          mutate: (input: unknown) => {
            mockGenerateMutate(input);
            opts?.onSuccess?.();
          },
          isPending: false,
        }),
      },
      optimizeSection: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
  },
}));

const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  mockClipboardWriteText.mockClear();
  mockToastInfo.mockClear();
  Object.assign(navigator, {
    clipboard: { writeText: mockClipboardWriteText },
  });
});

function renderStep3() {
  return render(
    <MemoryRouter>
      <Step3 />
    </MemoryRouter>,
  );
}

describe('Step3 integration (US-010b)', () => {
  // ── 6 H3 sections presence ────────────────────────────────────────────────

  it('renders Step3PageHeader H1 with "账号包装方案"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 1, name: /账号包装方案/ })).toBeInTheDocument();
  });

  it('renders default industry "美业" in header subtitle (no step1 data)', () => {
    renderStep3();
    expect(screen.getByText('美业')).toBeInTheDocument();
  });

  it('renders Step3Form with primary CTA button', () => {
    renderStep3();
    expect(screen.getByText('生成账号包装方案')).toBeInTheDocument();
  });

  it('renders Step3SectionDivider H2', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 2, name: /账号包装方案/ })).toBeInTheDocument();
  });

  it('renders VideoReferenceCaseSection H3 "视频参考案例"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /视频参考案例/ })).toBeInTheDocument();
  });

  it('renders NicknameRecommendSection H3 "昵称推荐"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /昵称推荐/ })).toBeInTheDocument();
  });

  it('renders AvatarDesignSection H3 "头像设计方案"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /头像设计方案/ })).toBeInTheDocument();
  });

  it('renders BackgroundImageDesignSection H3 "背景图设计方案"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /背景图设计方案/ })).toBeInTheDocument();
  });

  it('renders IntroCopySection H3 "简介文案方案"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /简介文案方案/ })).toBeInTheDocument();
  });

  it('renders OverallStrategySection H3 "整体包装策略"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /整体包装策略/ })).toBeInTheDocument();
  });

  // ── AC-4: all 6 H3 sections always render simultaneously ─────────────────

  it('renders all 6 H3 section headings simultaneously in default state (empty data)', () => {
    renderStep3();
    const h3Headings = screen.getAllByRole('heading', { level: 3 });
    const h3Texts = h3Headings.map((h) => h.textContent ?? '');
    expect(h3Texts.some((t) => /视频参考案例/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /昵称推荐/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /头像设计方案/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /背景图设计方案/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /简介文案方案/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /整体包装策略/.test(t))).toBe(true);
  });

  // ── AC-4: D-302 锁 · canBulkActions = !isLoading · mock data 时也 enabled ─

  it('toolbar bulk action buttons are enabled with mock data (canBulkActions = !isLoading, AC-4 D-302)', () => {
    renderStep3();
    expect(screen.getByRole('button', { name: /智能优化/ })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /一键重新生成/ })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /复制全部/ })).not.toBeDisabled();
  });

  // ── AC-6: toolbar 复制全部 → clipboard.writeText ──────────────────────────

  it('toolbar 复制全部 onClick triggers clipboard.writeText with serialized content (AC-6)', async () => {
    renderStep3();
    const copyAllBtn = screen.getByRole('button', { name: /复制全部/ });
    fireEvent.click(copyAllBtn);
    await waitFor(() => {
      expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.any(String));
    });
    const calledWith = mockClipboardWriteText.mock.calls[0]?.[0] as string;
    expect(calledWith.length).toBeGreaterThan(0);
  });

  // ── form interactions ────────────────────────────────────────────────────

  it('CTA button is disabled when personalInfo is empty', () => {
    renderStep3();
    const textarea = screen.getByPlaceholderText(/详细描述你的个人背景/);
    fireEvent.change(textarea, { target: { value: '' } });
    expect(screen.getByText('生成账号包装方案').closest('button')).toBeDisabled();
  });

  it('CTA button becomes enabled when personalInfo and platform are filled', () => {
    renderStep3();
    const textarea = screen.getByPlaceholderText(/详细描述你的个人背景/);
    fireEvent.change(textarea, { target: { value: '我是美容师' } });
    const platformBtns = screen.getAllByRole('button').filter(
      (b) => b.textContent?.includes('抖音') && !b.textContent?.includes('副'),
    );
    if (platformBtns[0]) fireEvent.click(platformBtns[0]);
    expect(screen.getByText('生成账号包装方案').closest('button')).not.toBeDisabled();
  });

  // ── AC-1: form submit calls generatePackage mutation ─────────────────────

  it('submitting form calls trpc.step3.generatePackage.mutate', async () => {
    mockGenerateMutate.mockClear();
    renderStep3();
    const textarea = screen.getByPlaceholderText(/详细描述你的个人背景/);
    fireEvent.change(textarea, { target: { value: '我是10年经验美容师' } });
    const platformBtns = screen.getAllByRole('button').filter(
      (b) => b.textContent?.includes('抖音') && !b.textContent?.includes('副'),
    );
    if (platformBtns[0]) fireEvent.click(platformBtns[0]);
    const submitBtn = screen.getByText('生成账号包装方案').closest('button');
    if (submitBtn) fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(mockGenerateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ personalInfo: '我是10年经验美容师' }),
      );
    });
  });

  // ── AC-4: industry from step1 (default '美业' when no step1 data) ─────────

  it('uses "美业" as default industry when step1 has no industry', () => {
    renderStep3();
    // GoldenHighlight renders industry text
    expect(screen.getByText('美业')).toBeInTheDocument();
  });
});

// ── US-006 AC-1 + AC-4: image gen stub buttons → toast.info ─────────────────

describe('Step3 image gen stub toast (US-006)', () => {
  it('VideoReferenceCaseSection "生成参考图" click triggers toast.info with DALL-E message', () => {
    renderStep3();
    const generateBtns = screen.getAllByRole('button', { name: /生成参考图/ });
    fireEvent.click(generateBtns[0]!);
    expect(mockToastInfo).toHaveBeenCalledWith(
      '图片生成功能需 admin 配置 OpenAI DALL-E key · 当前请使用文字描述参考',
    );
  });

  it('AvatarDesignSection "查看图标" click triggers toast.info with DALL-E message', () => {
    renderStep3();
    fireEvent.click(screen.getByRole('button', { name: /查看图标/ }));
    expect(mockToastInfo).toHaveBeenCalledWith(
      '图片生成功能需 admin 配置 OpenAI DALL-E key · 当前请使用文字描述参考',
    );
  });

  it('BackgroundImageDesignSection "生成参考图" click triggers toast.info with DALL-E message', () => {
    renderStep3();
    const generateBtns = screen.getAllByRole('button', { name: /生成参考图/ });
    // BackgroundImageDesignSection is the second "生成参考图" button (after VideoReferenceCaseSection)
    fireEvent.click(generateBtns[1]!);
    expect(mockToastInfo).toHaveBeenCalledWith(
      '图片生成功能需 admin 配置 OpenAI DALL-E key · 当前请使用文字描述参考',
    );
  });
});
