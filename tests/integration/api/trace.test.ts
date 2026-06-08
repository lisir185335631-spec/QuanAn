/**
 * Integration test — US-007 AC-8 / AC-13
 * Verifies full-stack trace_id propagation:
 *   - curl with X-Trace-Id header → API echoes same ID in response header
 *   - curl without X-Trace-Id → API generates 16-char hex ID
 * Requires dev server on localhost:3000.
 * 默认 skip · 设 RUN_SERVER_E2E=1 且 :3000 有服务才真跑(防止平时跑着的 dev server
 * 让本文件误跑 · 哲学同 RUN_REAL_LLM)。
 */

import { describe, it, expect } from 'vitest';

const API = 'http://localhost:3000';

// 显式开关 + 服务探测都满足才跑
const serverAvailable =
  process.env.RUN_SERVER_E2E === '1' &&
  (await fetch(`${API}/health`, { signal: AbortSignal.timeout(1000) })
    .then((r) => r.ok)
    .catch(() => false));

describe.skipIf(!serverAvailable)('[Integration] trace_id propagation', () => {
  it('echoes provided X-Trace-Id in response header', async () => {
    const res = await fetch(`${API}/health`, {
      headers: { 'x-trace-id': 'user-trace-001' },
    });
    expect(res.status).toBe(200);
    const echoed = res.headers.get('x-trace-id');
    expect(echoed).toBe('user-trace-001');
  });

  it('generates 16-char hex trace ID when header is absent', async () => {
    const res = await fetch(`${API}/health`);
    expect(res.status).toBe(200);
    const generated = res.headers.get('x-trace-id');
    expect(generated).toMatch(/^[0-9a-f]{16}$/);
  });
});
