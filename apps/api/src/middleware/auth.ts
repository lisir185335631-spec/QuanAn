import { logger } from '@/lib/logger';

import type { PrismaClient } from '@prisma/client';

// ── DEV OAuth mock helpers (PRD-15 US-001 AC-3) ────────────────────────────
// When NODE_ENV=development && DEV_OAUTH_MOCK=true the API skips real OAuth
// and returns a synthetic user bound to the seeded dev@quanqn.local account.

export const DEV_MOCK_USER_EMAIL = 'dev@quanqn.local';

export function isDevOAuthMock(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.DEV_OAUTH_MOCK === 'true';
}

/**
 * In dev mock mode, look up the seeded dev user from DB and return a Lucia-compatible
 * user attributes object. Returns null if the dev user has not been seeded yet.
 */
export async function getDevMockUserAttrs(prismaClient: PrismaClient) {
  return prismaClient.user.findUnique({
    where: { email: DEV_MOCK_USER_EMAIL },
    select: { id: true, email: true, name: true, activeAccountId: true },
  });
}

/**
 * Updates lastLoginAt + lastLoginIp for the authenticated user after successful login.
 * Failures are swallowed (logged at warn) — must not block the login flow (AC-7 US-005).
 */
export async function updateLastLogin(
  prisma: PrismaClient,
  userId: number,
  ip: string | undefined,
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        // Clamp to 45 chars for IPv6 safety — @db.VarChar(45) constraint (AC-8)
        lastLoginIp: ip ? ip.slice(0, 45) : null,
      },
    });
  } catch (e) {
    logger.warn({ err: e, userId }, 'auth.updateLastLogin.failed');
  }
}
