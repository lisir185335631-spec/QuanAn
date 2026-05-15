// PRD-14 US-012 · adminRouter.featureFlags
// SHIELD: emergencyToggleSystemConfig super_admin only · incidentId 必填(server 双校验)
// SHIELD: 3 关键开关 stop_trending_scraper / stop_evolution_agent / enable_fallback_prompt
// SHIELD: LD-A11 单点写操作 · 走 _updateSystemConfigInTx 不绕过

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';
import { emergencyToggleSystemConfig } from '@/services/admin/feature-flag/feature-flag.service';

// 3 关键紧急开关 keys · US-011 seed
const EMERGENCY_SWITCH_KEYS = [
  'stop_trending_scraper',
  'stop_evolution_agent',
  'enable_fallback_prompt',
] as const;

function guardSuperAdmin(ctx: { activeAdminUser?: { role?: string } | null }): void {
  if (ctx.activeAdminUser?.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'super_admin only' });
  }
}

export const featureFlagsRouter = adminTrpcRouter({
  /**
   * 紧急开关触发 — super_admin 1 click · incidentId 必填
   * 内部: requestApproval → emergencyApprove(postReviewRequired=true) → _updateSystemConfigInTx
   * 写 security_alert audit(eventType='emergency_switch_triggered') + 钉钉告警
   */
  emergencyToggleSystemConfig: adminProcedure
    .input(
      z.object({
        configKey: z.enum(EMERGENCY_SWITCH_KEYS),
        incidentId: z.string().min(1, 'incidentId is required'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      guardSuperAdmin(ctx);
      const { configKey, incidentId } = input;
      const superAdminId = ctx.activeAdminUser!.id as unknown as number;
      return emergencyToggleSystemConfig(configKey, true, superAdminId, incidentId);
    }),
});
