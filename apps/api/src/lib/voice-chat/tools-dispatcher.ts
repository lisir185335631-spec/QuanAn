/**
 * VoiceChat tools dispatcher — PRD-8 US-011 AC-2
 * 5 工具映射: prisma query per tool · each ≤ 2s
 * AC-8: per-accountId concurrency lock (prevent race on same session)
 */

import { logger } from '@/lib/logger';
import type { VoiceChatToolName } from '@/specialists/VoiceChatAgent';

import type { PrismaClient } from '@prisma/client';

// ── AC-8: per-accountId concurrency lock ────────────────────────────────────

const _lockMap = new Map<number, Promise<void>>();

async function withAccountLock<T>(accountId: number, fn: () => Promise<T>): Promise<T> {
  const prev = _lockMap.get(accountId) ?? Promise.resolve();
  let resolveLock!: () => void;
  const current = new Promise<void>((res) => {
    resolveLock = res;
  });
  _lockMap.set(accountId, current);
  await prev;
  try {
    return await fn();
  } finally {
    resolveLock();
    if (_lockMap.get(accountId) === current) _lockMap.delete(accountId);
  }
}

// ── Tool handlers (each ≤ 2s) ────────────────────────────────────────────────

async function getStepData(accountId: number, prisma: PrismaClient): Promise<string> {
  const rows = await prisma.stepData.findMany({
    where: { accountId },
    select: { stepKey: true, status: true, updatedAt: true },
    orderBy: { stepKey: 'asc' },
  });
  if (rows.length === 0) return JSON.stringify({ steps: [], completedCount: 0 });
  const completed = rows.filter((r) => r.status === 'completed').length;
  return JSON.stringify({ steps: rows, completedCount: completed, totalCount: rows.length });
}

async function searchHistory(
  accountId: number,
  args: Record<string, unknown>,
  prisma: PrismaClient,
): Promise<string> {
  const keyword = typeof args['keyword'] === 'string' ? args['keyword'] : '';
  const limit = typeof args['limit'] === 'number' ? Math.min(args['limit'], 10) : 5;
  const rows = await prisma.history.findMany({
    where: {
      accountId,
      ...(keyword ? { content: { contains: keyword } } : {}),
    },
    select: { id: true, agentId: true, inputSummary: true, content: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return JSON.stringify({ results: rows, keyword, count: rows.length });
}

async function getDiagnosis(accountId: number, prisma: PrismaClient): Promise<string> {
  const report = await prisma.diagnosisReport.findFirst({
    where: { accountId },
    select: {
      overallScore: true,
      inferredStage: true,
      topPriority: true,
      recommendedSteps: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!report) return JSON.stringify({ found: false });
  return JSON.stringify({ found: true, ...report });
}

async function getTodayTasks(accountId: number, prisma: PrismaClient): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const record = await prisma.dailyTask.findFirst({
    where: { accountId, taskDate: today },
    select: { tasks: true, completedCount: true, totalCount: true, taskDate: true },
  });
  if (!record) return JSON.stringify({ found: false, tasks: [] });
  return JSON.stringify({ found: true, ...record });
}

async function getEvolutionInsights(accountId: number, prisma: PrismaClient): Promise<string> {
  const [profile, insights] = await Promise.all([
    prisma.evolutionProfile.findUnique({
      where: { accountId },
      select: { level: true, currentDirection: true, autoEvolutionEnabled: true },
    }),
    prisma.evolutionInsight.findMany({
      where: { accountId },
      select: { direction: true, content: true, levelBefore: true, levelAfter: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);
  return JSON.stringify({ profile: profile ?? null, recentInsights: insights });
}

// ── Public dispatch API ───────────────────────────────────────────────────────

export async function dispatchTool(
  name: VoiceChatToolName,
  args: Record<string, unknown>,
  accountId: number,
  prisma: PrismaClient,
): Promise<string> {
  return withAccountLock(accountId, async () => {
    try {
      switch (name) {
        case 'get_current_step':
          return await getStepData(accountId, prisma);
        case 'search_history':
          return await searchHistory(accountId, args, prisma);
        case 'query_diagnosis':
          return await getDiagnosis(accountId, prisma);
        case 'get_today_tasks':
          return await getTodayTasks(accountId, prisma);
        case 'get_evolution_insights':
          return await getEvolutionInsights(accountId, prisma);
      }
    } catch (err) {
      logger.warn({ name, accountId, err: String(err) }, 'voice_chat.tool_dispatch.error');
      return JSON.stringify({ error: `工具 ${name} 暂时不可用` });
    }
  });
}
