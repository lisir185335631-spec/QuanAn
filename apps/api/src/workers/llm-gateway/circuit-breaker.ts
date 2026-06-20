/**
 * LLM Circuit Breaker — G9 真熔断器
 *
 * 按模型名(key)维护独立状态机：
 *   CLOSED  → 正常，允许调用
 *   OPEN    → 熔断，快速失败；冷却后转 HALF_OPEN
 *   HALF_OPEN → 放一个探针；成功→CLOSED，失败→立即 OPEN
 *
 * 常量可由 env 覆盖：
 *   LLM_CB_THRESHOLD   — 连续失败触发 OPEN 的次数 (默认 5)
 *   LLM_CB_COOLDOWN_MS — OPEN→HALF_OPEN 冷却毫秒数  (默认 30000)
 */

export const FAILURE_THRESHOLD = Number(process.env.LLM_CB_THRESHOLD ?? 5);
export const COOLDOWN_MS = Number(process.env.LLM_CB_COOLDOWN_MS ?? 30_000);

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface BreakerState {
  state: CircuitState;
  failureCount: number;
  openedAt: number; // epoch ms; 0 when CLOSED/HALF_OPEN (and not yet opened)
}

/**
 * isTransientError: 判断是否应计入熔断的错误类型。
 *   - HTTP 5xx、429（限流/过载）、网络/超时错误 → true（计入）
 *   - HTTP 4xx 客户端错（400/401/403/404）→ false（不计入）
 */
export function isTransientError(err: unknown): boolean {
  if (err == null || typeof err !== 'object') {
    // Non-object errors (e.g. plain strings or primitives) — treat as transient
    return true;
  }

  const e = err as Record<string, unknown>;

  // Anthropic SDK uses `.status`; OpenAI SDK uses `.status`; some wrappers use `.statusCode`
  const status =
    typeof e['status'] === 'number'
      ? e['status']
      : typeof e['statusCode'] === 'number'
        ? e['statusCode']
        : null;

  if (status !== null) {
    if (status >= 500) return true;   // 5xx server errors
    if (status === 429) return true;  // rate-limited / overloaded
    // 4xx client errors (400, 401, 403, 404, etc.) — not transient
    if (status >= 400 && status < 500) return false;
  }

  // No HTTP status — could be network error, timeout (AbortError), DNS failure
  // Detect by error code or name
  const code = typeof e['code'] === 'string' ? e['code'] : '';
  const name = typeof e['name'] === 'string' ? e['name'] : '';

  const isNetworkOrTimeout =
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    name === 'AbortError' ||
    name === 'TimeoutError';

  if (isNetworkOrTimeout) return true;

  // Unknown error without status — treat as transient (safe default: better to
  // count unknown failures than silently ignore real outages)
  return true;
}

export class CircuitBreaker {
  private readonly _states = new Map<string, BreakerState>();
  private readonly _now: () => number;

  /**
   * @param now 可注入假时钟（测试用）；默认 Date.now
   */
  constructor(now: () => number = Date.now) {
    this._now = now;
  }

  // ── public API ──────────────────────────────────────────────────────────────

  /**
   * canAttempt(key):
   *   CLOSED   → true
   *   OPEN     → 若已过冷却期 → 转 HALF_OPEN 返 true；否则 false（快速失败）
   *   HALF_OPEN → true（放一个探针）
   */
  canAttempt(key: string): boolean {
    const s = this._get(key);

    if (s.state === 'CLOSED') return true;

    if (s.state === 'OPEN') {
      if (this._now() - s.openedAt >= COOLDOWN_MS) {
        s.state = 'HALF_OPEN';
        return true;
      }
      return false; // fast-fail
    }

    // HALF_OPEN: let one probe through
    return true;
  }

  /**
   * recordSuccess(key): 重置 failureCount → 0，状态 → CLOSED
   */
  recordSuccess(key: string): void {
    const s = this._get(key);
    s.failureCount = 0;
    s.state = 'CLOSED';
    s.openedAt = 0;
  }

  /**
   * recordFailure(key):
   *   HALF_OPEN → 立即 OPEN（重置 openedAt）
   *   CLOSED    → failureCount++；若 ≥ FAILURE_THRESHOLD → OPEN（记 openedAt）
   *   OPEN      → 不变（已经 OPEN，冷却计时不重置）
   */
  recordFailure(key: string): void {
    const s = this._get(key);

    if (s.state === 'HALF_OPEN') {
      // 探针失败 → 立即重开熔断
      s.state = 'OPEN';
      s.openedAt = this._now();
      return;
    }

    if (s.state === 'CLOSED') {
      s.failureCount++;
      if (s.failureCount >= FAILURE_THRESHOLD) {
        s.state = 'OPEN';
        s.openedAt = this._now();
      }
    }

    // OPEN: nothing changes (don't reset timer mid-cooldown)
  }

  /** 仅供测试 / 健康检查读取状态 */
  getState(key: string): CircuitState {
    return this._get(key).state;
  }

  /** 仅供测试读取失败计数 */
  getFailureCount(key: string): number {
    return this._get(key).failureCount;
  }

  // ── private ─────────────────────────────────────────────────────────────────

  private _get(key: string): BreakerState {
    let s = this._states.get(key);
    if (!s) {
      s = { state: 'CLOSED', failureCount: 0, openedAt: 0 };
      this._states.set(key, s);
    }
    return s;
  }
}

/** 进程内单例 — LLMGateway 使用 */
export const llmCircuitBreaker = new CircuitBreaker();
