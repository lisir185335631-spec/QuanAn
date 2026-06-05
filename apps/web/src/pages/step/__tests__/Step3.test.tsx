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
  // ── H1 presence ────────────────────────────────────────────────────────────

  it('renders Step3PageHeader H1 with "账号包装方案"', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 1, name: /账号包装方案/ })).toBeInTheDocument();
  });

  it('renders default industry "美业" in header subtitle (no step1 data)', () => {
    renderStep3();
    // industry is rendered inline inside a <p> tag: 为「美业」生成…
    const para = screen.getByText(/为「美业」生成/);
    expect(para).toBeInTheDocument();
  });

  it('renders Step3Form with primary CTA button', () => {
    renderStep3();
    // CTA button now reads "生成包装矩阵"
    expect(screen.getByText('生成包装矩阵')).toBeInTheDocument();
  });

  it('renders Step3SectionDivider H2 — 输入节点参数', () => {
    renderStep3();
    // The new UI uses an H2 for the form section heading "输入节点参数"
    expect(screen.getByRole('heading', { level: 2, name: /输入节点参数/ })).toBeInTheDocument();
  });

  it('renders 矩阵命名 H3 (replaces 昵称推荐)', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /矩阵命名/ })).toBeInTheDocument();
  });

  it('renders 头像生成流 H3 (replaces 头像设计方案)', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /头像生成流/ })).toBeInTheDocument();
  });

  it('renders 背景墙视觉 H3 (replaces 背景图设计方案)', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /背景墙视觉/ })).toBeInTheDocument();
  });

  it('renders 简介文案公式 H3 (replaces 简介文案方案)', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /简介文案公式/ })).toBeInTheDocument();
  });

  it('renders 核心定位策略 H3 (replaces 整体包装策略)', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /核心定位策略/ })).toBeInTheDocument();
  });

  it('renders 下一步执行 H3 section', () => {
    renderStep3();
    expect(screen.getByRole('heading', { level: 3, name: /下一步执行/ })).toBeInTheDocument();
  });

  // ── AC-4: all key H3 module cards always render simultaneously ─────────────

  it('renders all key H3 section headings simultaneously in default state (empty data)', () => {
    renderStep3();
    const h3Headings = screen.getAllByRole('heading', { level: 3 });
    const h3Texts = h3Headings.map((h) => h.textContent ?? '');
    expect(h3Texts.some((t) => /矩阵命名/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /头像生成流/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /背景墙视觉/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /简介文案公式/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /核心定位策略/.test(t))).toBe(true);
    expect(h3Texts.some((t) => /下一步执行/.test(t))).toBe(true);
  });

  // ── AC-4: D-302 锁 · canBulkActions = !isLoading · mock data 时也 enabled ─

  it('toolbar bulk action buttons are enabled with mock data (canBulkActions = !isLoading, AC-4 D-302)', () => {
    renderStep3();
    // Toolbar buttons: 智能优化, 重新生成, 复制全部
    expect(screen.getByRole('button', { name: /智能优化/ })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /重新生成/ })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /复制全部/ })).not.toBeDisabled();
  });

  // ── AC-6: toolbar 复制全部 → clipboard.writeText ──────────────────────────

  it('toolbar 复制全部 onClick triggers clipboard.writeText with serialized content (AC-6)', async () => {
    renderStep3();
    const exportBtn = screen.getByRole('button', { name: /复制全部/ });
    fireEvent.click(exportBtn);
    await waitFor(() => {
      expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.any(String));
    });
    const calledWith = mockClipboardWriteText.mock.calls[0]?.[0] as string;
    expect(calledWith.length).toBeGreaterThan(0);
  });

  // ── form interactions ────────────────────────────────────────────────────

  it('CTA button is disabled when personalInfo is empty', () => {
    renderStep3();
    // placeholder is now "输入过去的经历、成就、特殊技能，以及希望传达的核心人设"
    const textarea = screen.getByPlaceholderText(/输入过去的经历/);
    fireEvent.change(textarea, { target: { value: '' } });
    expect(screen.getByText('生成包装矩阵').closest('button')).toBeDisabled();
  });

  it('CTA button becomes enabled when personalInfo and platform are filled', () => {
    renderStep3();
    const textarea = screen.getByPlaceholderText(/输入过去的经历/);
    fireEvent.change(textarea, { target: { value: '我是美容师' } });
    const platformBtns = screen.getAllByRole('button').filter(
      (b) => b.textContent?.includes('抖音') && !b.textContent?.includes('副'),
    );
    if (platformBtns[0]) fireEvent.click(platformBtns[0]);
    expect(screen.getByText('生成包装矩阵').closest('button')).not.toBeDisabled();
  });

  // ── AC-1: form submit calls generatePackage mutation ─────────────────────

  it('submitting form calls trpc.step3.generatePackage.mutate', async () => {
    mockGenerateMutate.mockClear();
    renderStep3();
    const textarea = screen.getByPlaceholderText(/输入过去的经历/);
    fireEvent.change(textarea, { target: { value: '我是10年经验美容师' } });
    const platformBtns = screen.getAllByRole('button').filter(
      (b) => b.textContent?.includes('抖音') && !b.textContent?.includes('副'),
    );
    if (platformBtns[0]) fireEvent.click(platformBtns[0]);
    const submitBtn = screen.getByText('生成包装矩阵').closest('button');
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
    // GoldenHighlight renders industry text inline: 为「美业」生成…
    expect(screen.getByText(/为「美业」生成/)).toBeInTheDocument();
  });
});

// ── US-006 AC-1 + AC-4: image gen stub buttons → toast.info ─────────────────

describe('Step3 image gen stub toast (US-006)', () => {
  it('头像生成流 "点击生成头像" click triggers toast.info with DALL-E message', () => {
    renderStep3();
    // Avatar section button now reads "点击生成头像"
    const avatarBtn = screen.getByRole('button', { name: /点击生成头像/ });
    fireEvent.click(avatarBtn);
    expect(mockToastInfo).toHaveBeenCalledWith(
      '图片生成功能需 admin 配置 OpenAI DALL-E key · 当前请使用文字描述参考',
    );
  });

  it('复制全部 button is rendered and clickable (replaces VideoReferenceCaseSection stub)', () => {
    renderStep3();
    // The VideoReferenceCaseSection no longer exists in the new UI.
    // Verify the export/copy button is present instead.
    expect(screen.getByRole('button', { name: /复制全部/ })).toBeInTheDocument();
  });

  it('复制全部 button triggers clipboard.writeText (replaces BackgroundImageDesignSection stub)', async () => {
    renderStep3();
    const exportBtn = screen.getByRole('button', { name: /复制全部/ });
    fireEvent.click(exportBtn);
    await waitFor(() => {
      expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
