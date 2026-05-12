// PRD-11 US-001 · AC-9: zod kpiSnapshotSchema · 13 fields strict typing
// rate fields: z.number().min(0).max(1)
// funnelData: z.array(z.number().int()).length(6)

import { z } from 'zod';

const rateSchema = z.number().min(0).max(1);

export const kpiSnapshotSchema = z.object({
  id: z.number().int().positive().optional(),
  snapshotDate: z.date(),
  granularity: z.enum(['day', 'week', 'month']),

  // 4 NSM metrics
  activeAccounts7d: z.number().int().nonnegative(),
  step9CompleteRate: rateSchema,
  feedbackRate: rateSchema,
  evolutionUpgradeRate: rateSchema,
  d30Retention: rateSchema,

  // 3 distributions
  userPersonaDistribution: z.object({
    ipBuilder: z.number().int().nonnegative(),
    opc: z.number().int().nonnegative(),
    traditional: z.number().int().nonnegative(),
    mcn: z.number().int().nonnegative(),
  }),
  industryDistribution: z.record(z.string(), z.number().int().nonnegative()),
  platformDistribution: z.record(z.string(), z.number().int().nonnegative()),

  // funnel: [register, step1, step3, step3b, step7, feedback]
  funnelData: z.array(z.number().int().nonnegative()).length(6),

  computedAt: z.date().optional(),
});

export type KpiSnapshotInput = z.infer<typeof kpiSnapshotSchema>;
