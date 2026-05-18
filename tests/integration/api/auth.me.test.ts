/**
 * Integration test for auth.me tRPC endpoint — AC-9
 * Requires dev server running on localhost:3000
 * Skipped automatically when no server is reachable (ECONNREFUSED).
 */

import { describe, it, expect } from 'vitest';

// Skip when dev server is not running
const serverAvailable = await fetch('http://localhost:3000/health', { signal: AbortSignal.timeout(1000) })
  .then((r) => r.ok)
  .catch(() => false);

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
