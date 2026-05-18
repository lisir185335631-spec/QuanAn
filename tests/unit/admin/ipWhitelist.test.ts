// PRD-10 US-003 · ipWhitelist middleware unit tests (AC-8: 6 tests)
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TRPCError } from '@trpc/server';

import { ipWhitelistMiddleware } from '@/trpc/middleware/admin/ipWhitelist';

type RawFn = (opts: { ctx: unknown; meta?: unknown; next: () => Promise<unknown> }) => Promise<unknown>;

function extractFn(mw: unknown): RawFn {
  return (mw as { _middlewares: RawFn[] })._middlewares[0]!;
}

function makeCtx(ip: string) {
  return {
    req: new Request('http://admin.localhost/trpc', {
      headers: { 'x-forwarded-for': ip },
    }),
  };
}

afterEach(() => {
  delete process.env.ADMIN_IP_WHITELIST_ENABLED;
  delete process.env.ADMIN_IP_WHITELIST_CIDRS;
});

describe('ipWhitelistMiddleware', () => {
  it('passes through when ADMIN_IP_WHITELIST_ENABLED is not set', async () => {
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(ipWhitelistMiddleware)({ ctx: makeCtx('1.2.3.4'), next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes when ENABLED=true and IP matches CIDR', async () => {
    process.env.ADMIN_IP_WHITELIST_ENABLED = 'true';
    process.env.ADMIN_IP_WHITELIST_CIDRS = '192.168.1.0/24';
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(ipWhitelistMiddleware)({ ctx: makeCtx('192.168.1.100'), next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('throws FORBIDDEN when ENABLED=true and IP does not match', async () => {
    process.env.ADMIN_IP_WHITELIST_ENABLED = 'true';
    process.env.ADMIN_IP_WHITELIST_CIDRS = '192.168.1.0/24';
    const next = vi.fn();
    await expect(
      extractFn(ipWhitelistMiddleware)({ ctx: makeCtx('10.0.0.1'), next }),
    ).rejects.toThrow(TRPCError);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes when IP matches one of multiple CIDRs', async () => {
    process.env.ADMIN_IP_WHITELIST_ENABLED = 'true';
    process.env.ADMIN_IP_WHITELIST_CIDRS = '10.0.0.0/8,192.168.1.0/24';
    const next = vi.fn().mockResolvedValue({ ok: true });
    await extractFn(ipWhitelistMiddleware)({ ctx: makeCtx('10.1.2.3'), next });
    expect(next).toHaveBeenCalledOnce();
  });

  it('skips invalid CIDR entries and still throws when no valid CIDR matches', async () => {
    process.env.ADMIN_IP_WHITELIST_ENABLED = 'true';
    process.env.ADMIN_IP_WHITELIST_CIDRS = 'not-a-cidr,192.168.2.0/24';
    const next = vi.fn();
    // IP doesn't match 192.168.2.0/24; invalid entry is skipped
    await expect(
      extractFn(ipWhitelistMiddleware)({ ctx: makeCtx('10.0.0.1'), next }),
    ).rejects.toThrow(TRPCError);
  });

  it('throws FORBIDDEN when ENABLED=true but CIDRS list is empty', async () => {
    process.env.ADMIN_IP_WHITELIST_ENABLED = 'true';
    process.env.ADMIN_IP_WHITELIST_CIDRS = '';
    const next = vi.fn();
    await expect(
      extractFn(ipWhitelistMiddleware)({ ctx: makeCtx('1.2.3.4'), next }),
    ).rejects.toThrow(TRPCError);
  });
});
