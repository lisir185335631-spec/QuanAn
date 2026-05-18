// PRD-14 US-009 · ConstantKeyDropdown unit tests
// AC-11: 按 type 加载选项(case=67 / formula=23 / element=22)
// @vitest-environment jsdom

import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ── Hoisted mock for tRPC ─────────────────────────────────────────────────

const mockListKeys = vi.hoisted(() => vi.fn());

vi.mock('../../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    constants: {
      listKeys: {
        useQuery: (_: unknown, __: unknown) => mockListKeys(),
      },
    },
  },
}));

import { ConstantKeyDropdown } from '../../../../apps/admin/src/pages/constants/components/ConstantKeyDropdown';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CASE_KEYS = Array.from({ length: 67 }, (_, i) => ({ key: `case_key_${i}`, label: `Case ${i}` }));
const FORMULA_KEYS = Array.from({ length: 23 }, (_, i) => ({ key: `formula_key_${i}`, label: `Formula ${i}` }));
const ELEMENT_KEYS = Array.from({ length: 22 }, (_, i) => ({ key: `element_key_${i}`, label: `Element ${i}` }));

describe('ConstantKeyDropdown', () => {
  it('renders 67 options for case type', () => {
    mockListKeys.mockReturnValue({ data: { keys: CASE_KEYS }, isLoading: false });
    const onSelect = vi.fn();
    render(
      <ConstantKeyDropdown
        constantType="case"
        selectedKey="case_key_0"
        onSelect={onSelect}
      />,
    );
    const select = screen.getByTestId('constant-key-select');
    expect(select.querySelectorAll('option').length).toBe(67);
  });

  it('renders 23 options for formula type', () => {
    mockListKeys.mockReturnValue({ data: { keys: FORMULA_KEYS }, isLoading: false });
    const onSelect = vi.fn();
    render(
      <ConstantKeyDropdown
        constantType="formula"
        selectedKey="formula_key_0"
        onSelect={onSelect}
      />,
    );
    const select = screen.getByTestId('constant-key-select');
    expect(select.querySelectorAll('option').length).toBe(23);
  });

  it('renders 22 options for element type', () => {
    mockListKeys.mockReturnValue({ data: { keys: ELEMENT_KEYS }, isLoading: false });
    const onSelect = vi.fn();
    render(
      <ConstantKeyDropdown
        constantType="element"
        selectedKey="element_key_0"
        onSelect={onSelect}
      />,
    );
    const select = screen.getByTestId('constant-key-select');
    expect(select.querySelectorAll('option').length).toBe(22);
  });

  it('shows loading state when isLoading=true', () => {
    mockListKeys.mockReturnValue({ data: undefined, isLoading: true });
    render(
      <ConstantKeyDropdown
        constantType="case"
        selectedKey=""
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('加载中…')).toBeInTheDocument();
  });

  it('calls onSelect when user picks a key', () => {
    mockListKeys.mockReturnValue({ data: { keys: CASE_KEYS }, isLoading: false });
    const onSelect = vi.fn();
    render(
      <ConstantKeyDropdown
        constantType="case"
        selectedKey="case_key_0"
        onSelect={onSelect}
      />,
    );
    const select = screen.getByTestId('constant-key-select');
    fireEvent.change(select, { target: { value: 'case_key_5' } });
    expect(onSelect).toHaveBeenCalledWith('case_key_5');
  });

  it('shows count badge with correct number', () => {
    mockListKeys.mockReturnValue({ data: { keys: FORMULA_KEYS }, isLoading: false });
    render(
      <ConstantKeyDropdown
        constantType="formula"
        selectedKey="formula_key_0"
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('23 个')).toBeInTheDocument();
  });

  it('shows 暂无选项 when keys array is empty', () => {
    mockListKeys.mockReturnValue({ data: { keys: [] }, isLoading: false });
    render(
      <ConstantKeyDropdown
        constantType="case"
        selectedKey=""
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无选项')).toBeInTheDocument();
  });
});
