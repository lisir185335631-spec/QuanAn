/**
 * L4 Profile helpers — PRD-8 US-001 AC-5
 * getLatestInsight: latest EvolutionInsight content for a given account
 * getDeepLearningSamples: recent deep learning archives for a given account
 */

import { EvolutionInsightContentSchema } from '@quanan/schemas/specialist-io';

import { prisma } from '@/lib/prisma';

import type { EvolutionInsightContent } from '@quanan/schemas/specialist-io';

export async function getLatestInsight(
  accountId: number,
): Promise<EvolutionInsightContent | null> {
  const profile = await prisma.evolutionProfile.findUnique({
    where: { accountId },
    select: { latestInsight: true },
  });
  if (!profile?.latestInsight) return null;
  const parsed = EvolutionInsightContentSchema.safeParse(profile.latestInsight);
  return parsed.success ? parsed.data : null;
}

export async function getDeepLearningSamples(
  accountId: number,
  limit = 10,
): Promise<{ id: number; sample: string; summary: string | null; tags: string[] }[]> {
  return prisma.deepLearningArchive.findMany({
    where: { accountId, isActive: true, learningStatus: 'completed' },
    select: { id: true, sample: true, summary: true, tags: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
