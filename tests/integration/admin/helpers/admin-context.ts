// PRD-10 US-006 · createMockAdminContext — builds a minimal AdminTRPCContext
// that satisfies adminAuth gate (non-null activeAdminUser + adminSession)
// without hitting the auth DB. req/res are stubs suitable for middleware tests.

import { prisma } from '@/lib/prisma';

import type { AdminTRPCContext } from '@/server/context-admin';

/**
 * Build a mock AdminTRPCContext for integration tests.
 * - activeAdminUser.id = adminUserId (must match a real seeded admin_users row for audit writes)
 * - adminSession.id is a stub string (adminAuth only checks non-null)
 */
export function createMockAdminContext(adminUserId: number): AdminTRPCContext {
  return {
    prisma,
    traceId: `mock-${adminUserId}-${Date.now()}`,
    req: new Request('http://localhost/trpc/admin', {
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'integration-test/rls-bypass',
      },
    }),
    resHeaders: new Headers(),
    adminSession: {
      id: `stub-session-${adminUserId}`,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      fresh: false,
    },
    activeAdminUser: {
      id: adminUserId,
      email: `admin-${adminUserId}@mock.test`,
      role: 'super_admin',
      isMock: true,
      isActive: true,
    },
    adminSessionMfaVerifiedAt: null,
  };
}
