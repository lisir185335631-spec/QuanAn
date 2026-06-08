/**
 * Integration test for auth.me tRPC endpoint — AC-9
 * Requires dev server running on localhost:3000
 * 默认 skip · 设 RUN_SERVER_E2E=1 且 :3000 有服务才真跑(服务器需连 DATABASE_URL_TEST,
 * 防止平时跑着的 dev server 让本文件误跑 · 哲学同 RUN_REAL_LLM)。
 */

import { describe, it, expect } from 'vitest';

// 显式开关 + 服务探测都满足才跑
const serverAvailable =
  process.env.RUN_SERVER_E2E === '1' &&
  (await fetch('http://localhost:3000/health', { signal: AbortSignal.timeout(1000) })
    .then((r) => r.ok)
    .catch(() => false));

// DEV_OAUTH_MOCK=true makes auth.me always return mock user even without a cookie,
// so the "unauthenticated" test is intentionally not applicable in that mode.
const devOAuthMock = process.env.DEV_OAUTH_MOCK === 'true';

describe.skipIf(!serverAvailable)('auth.me HTTP endpoint', () => {
  it.skipIf(devOAuthMock)('GET /trpc/auth.me returns unauthenticated shape', async () => {
    const res = await fetch('http://localhost:3000/trpc/auth.me');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result: { data: { ok: boolean; error: string } } };
    expect(body.result.data).toEqual({ ok: false, error: 'unauthenticated' });
  });
});
