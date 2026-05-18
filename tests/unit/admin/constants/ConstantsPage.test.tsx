// PRD-14 US-009 · ConstantsPage unit tests
// AC-2: 3 Tab · URL state · URL 变动时切换
// AC-3: constantKey dropdown rendered
// AC-4: version card rendered with version info
// @vitest-environment jsdom

import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ── Hoisted mocks ─────────────────────────────────────────────────────────

const mockSearchParams = vi.hoisted(() => new URLSearchParams('type=case&key=opinion_beauty_01'));
const mockSetSearchParams = vi.hoisted(() => vi.fn());

const mockGetActiveVersion = vi.hoisted(() => vi.fn());
const mockListVersions = vi.hoisted(() => vi.fn());
const mockListKeys = vi.hoisted(() => vi.fn());
const mockSaveDraftMutate = vi.hoisted(() => vi.fn());
const mockSubmitMutate = vi.hoisted(() => vi.fn());
const mockRollbackMutate = vi.hoisted(() => vi.fn());
const mockMe = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

vi.mock('../../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    auth: {
      me: { useQuery: () => mockMe() },
    },
    constants: {
      getActiveVersion: { useQuery: (_: unknown, __: unknown) => mockGetActiveVersion() },
      listVersions: { useQuery: (_: unknown, __: unknown) => mockListVersions() },
      listKeys: { useQuery: (_: unknown, __: unknown) => mockListKeys() },
      saveDraft: {
        useMutation: ({ onSuccess, onError }: { onSuccess?: (d: unknown) => void; onError?: (e: unknown) => void }) => ({
          mutate: mockSaveDraftMutate,
          isPending: false,
          _onSuccess: onSuccess,
          _onError: onError,
        }),
      },
      submitForReview: {
        useMutation: ({ onSuccess, onError }: { onSuccess?: () => void; onError?: (e: unknown) => void }) => ({
          mutate: mockSubmitMutate,
          isPending: false,
          _onSuccess: onSuccess,
          _onError: onError,
        }),
      },
      rollbackVersion: {
        useMutation: ({ onSuccess, onError }: { onSuccess?: () => void; onError?: (e: unknown) => void }) => ({
          mutate: mockRollbackMutate,
          isPending: false,
          _onSuccess: onSuccess,
          _onError: onError,
        }),
      },
    },
  },
}));

// Mock MonacoEditor to avoid monaco loading
vi.mock('../../../../apps/admin/src/pages/prompts/components/MonacoEditor', () => ({
  MonacoEditor: ({ value, readOnly }: { value: string; readOnly?: boolean }) => (
    <div data-testid="monaco-editor" data-readonly={String(readOnly ?? false)}>
      {value.slice(0, 100)}
    </div>
  ),
  DiffMonacoEditor: ({ original, modified }: { original: string; modified: string }) => (
    <div data-testid="diff-editor">
      <span data-testid="original">{original.slice(0, 50)}</span>
      <span data-testid="modified">{modified.slice(0, 50)}</span>
    </div>
  ),
}));

// Mock ConstantKeyDropdown
vi.mock('../../../../apps/admin/src/pages/constants/components/ConstantKeyDropdown', () => ({
  ConstantKeyDropdown: ({
    constantType,
    selectedKey,
    onSelect,
  }: {
    constantType: string;
    selectedKey: string;
    onSelect: (k: string) => void;
  }) => (
    <select
      data-testid="key-dropdown"
      data-type={constantType}
      value={selectedKey}
      onChange={(e) => onSelect(e.target.value)}
    >
      <option value={selectedKey}>{selectedKey}</option>
      <option value="other_key">other_key</option>
    </select>
  ),
}));

// Mock HistoryTimeline
vi.mock('../../../../apps/admin/src/pages/constants/components/HistoryTimeline', () => ({
  HistoryTimeline: ({ versions, isLoading }: { versions: unknown[]; isLoading?: boolean }) => (
    <div data-testid="history-timeline">
      {isLoading ? '加载中…' : `${versions.length} versions`}
    </div>
  ),
}));

import ConstantsPage from '../../../../apps/admin/src/pages/constants/ConstantsPage';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function setupDefaults({
  type = 'case',
  key = 'opinion_beauty_01',
  withVersion = false,
}: {
  type?: string;
  key?: string;
  withVersion?: boolean;
} = {}) {
  mockSearchParams.set('type', type);
  mockSearchParams.set('key', key);

  mockMe.mockReturnValue({ data: { role: 'super_admin' } });
  mockListKeys.mockReturnValue({ data: { keys: [{ key, label: 'Test Key' }] }, isLoading: false });
  mockListVersions.mockReturnValue({ data: { versions: [] }, isLoading: false, refetch: vi.fn() });

  if (withVersion) {
    mockGetActiveVersion.mockReturnValue({
      data: {
        version: {
          id: 5,
          version: 2,
          status: 'active',
          judgeScore: '4.50',
          createdAt: new Date('2026-01-01'),
          createdByAdminId: 1,
          content: '{"test":true}',
        },
        canaryConfig: { canaryPct: 10 },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
  } else {
    mockGetActiveVersion.mockReturnValue({
      data: { version: null, canaryConfig: null },
      isLoading: false,
      refetch: vi.fn(),
    });
  }
}

describe('ConstantsPage', () => {
  it('renders 3 tab buttons: 知识案例 / 公式 / 元素', () => {
    setupDefaults();
    render(<ConstantsPage />);
    expect(screen.getAllByText(/知识案例/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^公式/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^元素/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders constantKey dropdown', () => {
    setupDefaults();
    render(<ConstantsPage />);
    expect(screen.getByTestId('key-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('key-dropdown')).toHaveAttribute('data-type', 'case');
  });

  it('shows "暂无线上版本" when no active version', () => {
    setupDefaults({ withVersion: false });
    render(<ConstantsPage />);
    const matches = screen.getAllByText(/暂无线上版本/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders version card with v2 when active version exists', () => {
    setupDefaults({ withVersion: true });
    render(<ConstantsPage />);
    expect(screen.getByText('v2')).toBeInTheDocument();
  });

  it('renders history timeline', () => {
    setupDefaults();
    render(<ConstantsPage />);
    expect(screen.getByTestId('history-timeline')).toBeInTheDocument();
  });

  it('clicking 公式 tab calls setSearchParams with type=formula', () => {
    setupDefaults();
    render(<ConstantsPage />);
    const formulaBtn = screen.getByText(/^公式/);
    fireEvent.click(formulaBtn);
    expect(mockSetSearchParams).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'formula' }),
    );
  });

  it('clicking 元素 tab calls setSearchParams with type=element', () => {
    setupDefaults();
    render(<ConstantsPage />);
    const elementBtn = screen.getByText(/^元素/);
    fireEvent.click(elementBtn);
    expect(mockSetSearchParams).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'element' }),
    );
  });

  it('clicking 编辑 button shows editor toolbar', () => {
    setupDefaults({ withVersion: true });
    render(<ConstantsPage />);
    const editBtn = screen.getByText('编辑');
    fireEvent.click(editBtn);
    expect(screen.getByText('提交审核')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('clicking 取消 hides editor toolbar', () => {
    setupDefaults({ withVersion: true });
    render(<ConstantsPage />);
    fireEvent.click(screen.getByText('编辑'));
    fireEvent.click(screen.getByText('取消'));
    expect(screen.queryByText('提交审核')).not.toBeInTheDocument();
  });

  it('Diff 视图 button toggles diff mode', () => {
    setupDefaults({ withVersion: true });
    render(<ConstantsPage />);
    fireEvent.click(screen.getByText('编辑'));
    const diffBtn = screen.getByText('Diff 视图');
    fireEvent.click(diffBtn);
    expect(screen.getByTestId('diff-editor')).toBeInTheDocument();
  });
});
