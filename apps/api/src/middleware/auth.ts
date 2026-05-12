import { logger } from '@/lib/logger';

import type { PrismaClient } from '@prisma/client';

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
