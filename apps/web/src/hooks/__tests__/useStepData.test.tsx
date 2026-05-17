/**
 * useStepData + readOtherStep — PRD-19 US-002
 * AC: (a) save triggers trpc mutation; (b) load reads LS synchronously;
 *     (c) dbQuery enabled only when accountId !== null;
 *     (d) readOtherStep null safety; (e) JSON.parse failure → warn + null
 */
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readOtherStep, useStepData } from '../useStepData';

// ── trpc mock ─────────────────────────────────────────────────────────────────

const { mockMutate, mockUseQuery } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseQuery: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    stepData: {
      save: {
        useMutation: () => ({ mutate: mockMutate, isPending: false }),
      },
      get: {
        useQuery: mockUseQuery,
      },
    },
  },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

// ── helpers ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: null, isLoading: false });
});

describe('useStepData', () => {
  it('(a) save() writes LS then calls trpc mutation', () => {
    const { result } = renderHook(() => useStepData(1, 'step1'));

    act(() => {
      result.current.save({ industry: '科技' });
    });

    // LS written
    const key = `aiip_memory_acc_1_step1`;
    expect(localStorage.getItem(key)).toBe(JSON.stringify({ industry: '科技' }));
    // mutation fired
    expect(mockMutate).toHaveBeenCalledWith(
      { stepKey: 'step1', inputs: { industry: '科技' } },
      expect.any(Object),
    );
  });

  it('(b) load() reads synchronously from localStorage', () => {
    localStorage.setItem('aiip_memory_acc_1_step1', JSON.stringify({ industry: '教育' }));

    const { result } = renderHook(() => useStepData(1, 'step1'));
    expect(result.current.load()).toEqual({ industry: '教育' });
  });

  it('(b) load() returns null when key absent', () => {
    const { result } = renderHook(() => useStepData(1, 'step1'));
    expect(result.current.load()).toBeNull();
  });

  it('(c) dbQuery enabled=true when accountId !== null', () => {
    renderHook(() => useStepData(42, 'step3'));
    expect(mockUseQuery).toHaveBeenCalledWith(
      { stepKey: 'step3' },
      expect.objectContaining({ enabled: true }),
    );
  });

  it('(c) dbQuery enabled=false when accountId === null', () => {
    renderHook(() => useStepData(null, 'step3'));
    expect(mockUseQuery).toHaveBeenCalledWith(
      { stepKey: 'step3' },
      expect.objectContaining({ enabled: false }),
    );
  });

  it('(c) dbQuery has staleTime 30000 and retry false', () => {
    renderHook(() => useStepData(1, 'step1'));
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ staleTime: 30_000, retry: false }),
    );
  });

  it('return shape includes save, load, isSaving, dbQuery', () => {
    const { result } = renderHook(() => useStepData(1, 'step1'));
    expect(result.current).toMatchObject({
      save: expect.any(Function),
      load: expect.any(Function),
      isSaving: false,
      dbQuery: expect.any(Object),
    });
  });
});

describe('readOtherStep', () => {
  it('(d) returns null when accountId is null', () => {
    expect(readOtherStep(null, 'step1')).toBeNull();
  });

  it('(d) returns null when LS key absent', () => {
    expect(readOtherStep(1, 'step1')).toBeNull();
  });

  it('(d) returns parsed value when key present', () => {
    localStorage.setItem('aiip_memory_acc_5_step1', JSON.stringify({ industry: '美妆' }));
    expect(readOtherStep(5, 'step1')).toEqual({ industry: '美妆' });
  });

  it('(e) JSON.parse failure → console.warn + return null', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('aiip_memory_acc_1_step1', 'not-valid-json{{{');

    const result = readOtherStep(1, 'step1');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      '[readOtherStep] JSON.parse failed',
      expect.objectContaining({ accountId: 1, otherStepKey: 'step1' }),
    );
    warnSpy.mockRestore();
  });
});
