// PRD-10 US-003 · adminProcedure chain order verification (AC-12: 6-gate order hard constraint)
// Changing gate order must cause this test to fail.
// Note: tRPC v11 stores raw functions in _def.middlewares, not the wrapper objects.
import { describe, it, expect } from 'vitest';

import { adminProcedure } from '@/trpc/procedures/admin';
import { adminAuthMiddleware } from '@/trpc/middleware/admin/adminAuth';
import { roleCheckMiddleware } from '@/trpc/middleware/admin/roleCheck';
import { ipWhitelistMiddleware } from '@/trpc/middleware/admin/ipWhitelist';
import { mfaCheckMiddleware } from '@/trpc/middleware/admin/mfaCheck';
import { adminRLSMiddleware } from '@/trpc/middleware/admin/adminRLS';
import { approvalGateCheckMiddleware } from '@/trpc/middleware/admin/approvalGateCheck';
import { auditLogMiddleware } from '@/trpc/middleware/admin/auditLog';

type MwWrapper = { _middlewares: unknown[] };

/** Extract the raw function that tRPC stores in _def.middlewares */
function rawFn(mw: unknown): unknown {
  return (mw as MwWrapper)._middlewares[0];
}

describe('adminProcedure 6-gate order hard constraint', () => {
  it('contains all 7 middleware in the correct gate order', () => {
    // tRPC v11: _def.middlewares stores raw functions (mw._middlewares[0]), not wrapper objects
    const middlewares = (adminProcedure as unknown as { _def: { middlewares: unknown[] } })._def
      .middlewares;

    const authIdx = middlewares.indexOf(rawFn(adminAuthMiddleware));
    const roleIdx = middlewares.indexOf(rawFn(roleCheckMiddleware));
    const ipIdx = middlewares.indexOf(rawFn(ipWhitelistMiddleware));
    const mfaIdx = middlewares.indexOf(rawFn(mfaCheckMiddleware));
    const rlsIdx = middlewares.indexOf(rawFn(adminRLSMiddleware));
    const approvalIdx = middlewares.indexOf(rawFn(approvalGateCheckMiddleware));
    const auditIdx = middlewares.indexOf(rawFn(auditLogMiddleware));

    // All 7 must be present
    expect(authIdx, 'adminAuth missing').toBeGreaterThan(-1);
    expect(roleIdx, 'roleCheck missing').toBeGreaterThan(-1);
    expect(ipIdx, 'ipWhitelist missing').toBeGreaterThan(-1);
    expect(mfaIdx, 'mfaCheck missing').toBeGreaterThan(-1);
    expect(rlsIdx, 'adminRLS missing').toBeGreaterThan(-1);
    expect(approvalIdx, 'approvalGateCheck missing').toBeGreaterThan(-1);
    expect(auditIdx, 'auditLog missing').toBeGreaterThan(-1);

    // Hard order constraint: adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog
    expect(authIdx).toBeLessThan(roleIdx);
    expect(roleIdx).toBeLessThan(ipIdx);
    expect(ipIdx).toBeLessThan(mfaIdx);
    expect(mfaIdx).toBeLessThan(rlsIdx);
    expect(rlsIdx).toBeLessThan(approvalIdx);
    expect(approvalIdx).toBeLessThan(auditIdx);
  });
});
