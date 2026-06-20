/**
 * G9 真熔断器 — CircuitBreaker + isTransientError 纯单元测试
 *
 * 核心证据：
 *   A. 真熔断证据：5 次失败 → OPEN → canAttempt=false（快速失败）
 *   B. 冷却恢复证据：假时钟推进 ≥COOLDOWN → HALF_OPEN → 成功 → CLOSED
 *
 * 本文件不 mock circuit-breaker 模块本身，直接导入真实实现。
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  CircuitBreaker,
  isTransientError,
  FAILURE_THRESHOLD,
  COOLDOWN_MS,
} from '../circuit-breaker';

// ── CircuitBreaker 状态机单元测试 ──────────────────────────────────────────────

describe('CircuitBreaker — 单元', () => {
  let fakeNow: number;
  let cb: CircuitBreaker;

  beforeEach(() => {
    fakeNow = 1_000_000; // 任意起始时间
    cb = new CircuitBreaker(() => fakeNow);
  });

  // ── 真熔断证据 A ─────────────────────────────────────────────────────────

  it('【真熔断 A】连续 5 次 recordFailure → 状态 OPEN、canAttempt=false', () => {
    const key = 'claude-sonnet-4-6';
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      expect(cb.canAttempt(key)).toBe(true); // 前 N 次仍允许
      cb.recordFailure(key);
    }
    // 达到阈值后
    expect(cb.getState(key)).toBe('OPEN');
    expect(cb.canAttempt(key)).toBe(false); // 快速失败
  });

  it('4 次失败不触发 OPEN', () => {
    const key = 'gpt-4o';
    for (let i = 0; i < FAILURE_THRESHOLD - 1; i++) {
      cb.recordFailure(key);
    }
    expect(cb.getState(key)).toBe('CLOSED');
    expect(cb.canAttempt(key)).toBe(true);
  });

  it('CLOSED 下 4 次失败 + 1 次成功 → failureCount 重置，不 OPEN', () => {
    const key = 'claude-haiku-4-5';
    for (let i = 0; i < FAILURE_THRESHOLD - 1; i++) {
      cb.recordFailure(key);
    }
    cb.recordSuccess(key);
    expect(cb.getState(key)).toBe('CLOSED');
    expect(cb.getFailureCount(key)).toBe(0);
    // 再失败 FAILURE_THRESHOLD-1 次仍不 OPEN
    for (let i = 0; i < FAILURE_THRESHOLD - 1; i++) {
      cb.recordFailure(key);
    }
    expect(cb.getState(key)).toBe('CLOSED');
  });

  // ── 冷却恢复证据 B ────────────────────────────────────────────────────────

  it('【冷却恢复 B】OPEN → 假时钟推进 ≥COOLDOWN → canAttempt=true 且状态 HALF_OPEN', () => {
    const key = 'claude-sonnet-4-6';
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      cb.recordFailure(key);
    }
    expect(cb.getState(key)).toBe('OPEN');
    expect(cb.canAttempt(key)).toBe(false);

    // 推进假时钟 —— 冷却未到时仍 false
    fakeNow += COOLDOWN_MS - 1;
    expect(cb.canAttempt(key)).toBe(false);

    // 推进到恰好冷却完成
    fakeNow += 1; // now == openedAt + COOLDOWN_MS
    expect(cb.canAttempt(key)).toBe(true);
    expect(cb.getState(key)).toBe('HALF_OPEN');
  });

  it('【恢复 B2】HALF_OPEN 下 recordSuccess → 状态 CLOSED、failureCount=0', () => {
    const key = 'claude-sonnet-4-6';
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      cb.recordFailure(key);
    }
    fakeNow += COOLDOWN_MS;
    cb.canAttempt(key); // → HALF_OPEN
    expect(cb.getState(key)).toBe('HALF_OPEN');

    cb.recordSuccess(key);
    expect(cb.getState(key)).toBe('CLOSED');
    expect(cb.getFailureCount(key)).toBe(0);
  });

  it('【恢复 B3】HALF_OPEN 下 recordFailure → 立即 OPEN（重置 openedAt）', () => {
    const key = 'claude-sonnet-4-6';
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      cb.recordFailure(key);
    }

    // 推进时间让其进入 HALF_OPEN
    fakeNow += COOLDOWN_MS + 100;
    expect(cb.canAttempt(key)).toBe(true);
    expect(cb.getState(key)).toBe('HALF_OPEN');

    // 探针失败 → 立即 OPEN，且 openedAt 更新为当前假时钟
    cb.recordFailure(key);
    expect(cb.getState(key)).toBe('OPEN');

    // 由于 openedAt 已更新，冷却需重新计时 — 仍不可尝试
    fakeNow += 1; // 只推进 1ms，远未冷却
    expect(cb.canAttempt(key)).toBe(false);

    // 必须再过 COOLDOWN_MS 才能进入 HALF_OPEN
    fakeNow += COOLDOWN_MS;
    expect(cb.canAttempt(key)).toBe(true);
  });

  it('OPEN 期间冷却计时不因 recordFailure 重置（OPEN 下幂等）', () => {
    const key = 'model-x';
    for (let i = 0; i < FAILURE_THRESHOLD; i++) cb.recordFailure(key);
    const openedAt = fakeNow; // state went OPEN at this time

    // 再多记几次失败（不应重置冷却计时）
    fakeNow += 100;
    cb.recordFailure(key);
    cb.recordFailure(key);

    // 从 openedAt 算满 COOLDOWN 即可恢复
    fakeNow = openedAt + COOLDOWN_MS;
    expect(cb.canAttempt(key)).toBe(true);
    expect(cb.getState(key)).toBe('HALF_OPEN');
  });

  it('不同模型 key 状态完全隔离', () => {
    const a = 'claude-sonnet-4-6';
    const b = 'gpt-4o';
    for (let i = 0; i < FAILURE_THRESHOLD; i++) cb.recordFailure(a);
    expect(cb.getState(a)).toBe('OPEN');
    expect(cb.getState(b)).toBe('CLOSED');
    expect(cb.canAttempt(b)).toBe(true);
  });
});

// ── isTransientError 单元测试 ──────────────────────────────────────────────────

describe('isTransientError', () => {
  it('HTTP 500 → true', () => {
    expect(isTransientError({ status: 500 })).toBe(true);
  });
  it('HTTP 503 → true', () => {
    expect(isTransientError({ status: 503 })).toBe(true);
  });
  it('HTTP 429 → true（限流）', () => {
    expect(isTransientError({ status: 429 })).toBe(true);
  });
  it('HTTP 400 → false（客户端错）', () => {
    expect(isTransientError({ status: 400 })).toBe(false);
  });
  it('HTTP 401 → false（未授权）', () => {
    expect(isTransientError({ status: 401 })).toBe(false);
  });
  it('HTTP 403 → false（禁止）', () => {
    expect(isTransientError({ status: 403 })).toBe(false);
  });
  it('HTTP 404 → false（不存在）', () => {
    expect(isTransientError({ status: 404 })).toBe(false);
  });
  it('statusCode 字段（兼容部分 SDK）500 → true', () => {
    expect(isTransientError({ statusCode: 500 })).toBe(true);
  });
  it('statusCode 401 → false', () => {
    expect(isTransientError({ statusCode: 401 })).toBe(false);
  });
  it('AbortError（超时）→ true', () => {
    expect(isTransientError({ name: 'AbortError' })).toBe(true);
  });
  it('ECONNREFUSED（网络错）→ true', () => {
    expect(isTransientError({ code: 'ECONNREFUSED' })).toBe(true);
  });
  it('ETIMEDOUT → true', () => {
    expect(isTransientError({ code: 'ETIMEDOUT' })).toBe(true);
  });
  it('null → true（保守策略）', () => {
    expect(isTransientError(null)).toBe(true);
  });
  it('普通 Error 无 status → true（保守策略）', () => {
    expect(isTransientError(new Error('unknown'))).toBe(true);
  });
});
