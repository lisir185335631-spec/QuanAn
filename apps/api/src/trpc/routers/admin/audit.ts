// PRD-10 US-005 · audit.listMine procedure stub
// AC-12: 返当前 admin 最近 50 条 admin_audit_log

import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

export const adminAuditRouter = adminTrpcRouter({
  /** Returns the current admin user's last 50 audit log entries. */
  listMine: adminProcedure.query(async ({ ctx }) => {
    const adminUserId = ctx.activeAdminUser?.id;
    if (!adminUserId) return [];

    return ctx.prisma.adminAuditLog.findMany({
      where: { actorAdminId: adminUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        eventType: true,
        eventCategory: true,
        createdAt: true,
        payload: true,
      },
    });
  }),
});
