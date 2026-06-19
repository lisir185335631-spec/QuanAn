/**
 * privateDomain router — PRD-27 US-002
 * AC-1: 删 buildPhases() + mock array · generate mutation 改 privateDomainAgent.execute({mode:'phase-generate',...})
 * AC-2: generateStream subscription 保留 · phase 内逐 chunk yield(meta + delta + done)
 */

import { z } from 'zod';

import { privateDomainAgent, PRIVATE_DOMAIN_PHASE_ENUM, PHASE_TEMPLATES, PHASE_LABEL } from '@/specialists/PrivateDomainAgent';
import { PRIVATE_DOMAIN_TEMPLATE } from '@/services/context-assembler/templates/private-domain';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';
import { llmGateway } from '@/workers/llm-gateway';

import type { Prisma } from '@prisma/client';

const generatePrivateDomainInput = z.object({
  phase: z.enum(PRIVATE_DOMAIN_PHASE_ENUM),
  productDescription: z.string().min(1).max(1000),
  productPrice: z.number().positive(),
  targetAudience: z.string().min(1).max(500),
  ipPositioning: z.string().min(1).max(500),
  currentChannel: z.enum(['wechat', 'douyin', 'xiaohongshu', 'weibo', 'other']),
  monthlyTraffic: z.number().int().min(0),
  scene: z.string().max(300).optional(),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  agentMode: true,
  traceId: true,
  isFallback: true,
  tokensUsed: true,
  modelUsed: true,
  durationMs: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const privateDomainRouter = router({
  /** AC-1: generate mutation → privateDomainAgent.execute({mode:'phase-generate',...}) */
  generate: protectedProcedure
    .input(generatePrivateDomainInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId, user } = ctx;

      const agentRes = await privateDomainAgent.execute({
        accountId: activeAccountId!,
        userId: user!.id,
        mode: 'phase-generate',
        userInput: input,
        traceId: traceId ?? undefined,
        stepKey: 'tool-private-domain',
      });

      const inputSummary = `[${input.phase}] ${input.productDescription.slice(0, 50)} · ¥${input.productPrice} · ${input.targetAudience.slice(0, 30)}`;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'PrivateDomainAgent',
          agentMode: 'phase-generate',
          sourceType: 'user',
          inputSummary,
          content: JSON.stringify(agentRes.result),
          contentType: 'json',
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });

      return row;
    }),

  /**
   * AC-2: SSE streaming subscription — phase 内逐 chunk yield(meta + delta + done)
   * chunk-level: not phase-level. Calls llmGateway.stream() directly for live UX.
   */
  generateStream: protectedProcedure
    .input(generatePrivateDomainInput)
    .subscription(async function* ({ ctx, input }) {
      const { activeAccountId, traceId, user } = ctx;
      const tmpl = PHASE_TEMPLATES[input.phase];
      const systemPrompt = [
        PRIVATE_DOMAIN_TEMPLATE.persona,
        '',
        `## 当前阶段：${PHASE_LABEL[input.phase]}(${input.phase})`,
        `**目标**：${tmpl.goal}`,
        `**核心策略**：${tmpl.tactics}`,
        `**输出期望**：${tmpl.outputHint}`,
      ].join('\n');
      const userPrompt = privateDomainAgent._buildUserPrompt(input.phase, input);

      let accumulated = '';

      try {
        for await (const chunk of llmGateway.stream({
          model_tier: 'lightweight',
          systemPrompt,
          userPrompt,
          metadata: {
            trace_id: traceId ?? '',
            agentId: 'PrivateDomainAgent',
            accountId: activeAccountId!,
            userId: user!.id,
            eventType: 'specialist_call',
          },
          timeout_ms: 60_000,
        })) {
          if (chunk.type === 'meta' && chunk.meta) {
            yield { type: 'meta' as const, meta: { model: chunk.meta.model } };
          } else if (chunk.type === 'delta' && chunk.delta) {
            accumulated += chunk.delta;
            yield { type: 'delta' as const, delta: chunk.delta };
          } else if (chunk.type === 'done') {
            let result = null;
            try {
              result = JSON.parse(accumulated) as { phaseScript: string; variants: { professional: string; friendly: string; sales: string } };
            } catch {
              // JSON parse failure — frontend falls back to mutation result
            }
            yield { type: 'done' as const, result };
            return;
          }
        }
      } catch {
        yield { type: 'done' as const, result: null };
      }
    }),
});
