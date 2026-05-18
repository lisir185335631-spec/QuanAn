// PRD-10 US-003 · roleCheck — ADMIN_ROLE_HIERARCHY + meta.requiredRole level check
import { TRPCError } from '@trpc/server';

import { middleware } from '@/trpc/trpc-admin';

export const ADMIN_ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 3,
  admin: 2,
  readonly_admin: 1,
};

export const roleCheckMiddleware = middleware(async ({ ctx, meta, next }) => {
  const requiredRole = meta?.requiredRole;
  if (!requiredRole) return next();

  const userLevel = ADMIN_ROLE_HIERARCHY[ctx.activeAdminUser?.role ?? ''] ?? 0;
  const requiredLevel = ADMIN_ROLE_HIERARCHY[requiredRole] ?? Infinity;

  if (userLevel < requiredLevel) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'insufficient_role' });
  }

  return next();
});
