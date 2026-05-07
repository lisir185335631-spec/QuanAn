/**
 * Integration test for auth.me tRPC endpoint — AC-9
 * Requires dev server running on localhost:3000
 */

import { describe, it, expect } from 'vitest';

describe('auth.me HTTP endpoint', () => {
  it('GET /trpc/auth.me returns unauthenticated shape', async () => {
    const res = await fetch('http://localhost:3000/trpc/auth.me');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result: { data: { ok: boolean; error: string } } };
    expect(body.result.data).toEqual({ ok: false, error: 'unauthenticated' });
  });
});
