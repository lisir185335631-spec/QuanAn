/**
 * Evolution profile router — PRD-2 US-002
 * AC-3: getProfile returns EvolutionProfile for the active account (cached client-side in LS)
 */

import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

export const evolutionRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, activeAccountId } = ctx;

    const profile = await prisma.evolutionProfile.findUnique({
      where: { accountId: activeAccountId! },
      select: {
        id: true,
        level: true,
        feedbackCountGood: true,
        feedbackCountBad: true,
        feedbackCountTotal: true,
        satisfactionRate: true,
        currentDirection: true,
        autoEvolutionEnabled: true,
        deepLearningCount: true,
        lastEvolvedAt: true,
        lastUpgradedAt: true,
        updatedAt: true,
      },
    });

    return profile ?? null;
  }),
});
