/**
 * QuanQn · LLMGateway cost_log writer
 * AC-6: writes userId/model/tokens/durationMs/success/isFallback/traceId to cost_log
 */

import { Decimal } from '@prisma/client/runtime/library';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

import type { CompleteRequest, CompleteResponse } from './index';

// Approximate cost per 1M tokens (USD) — used for cost estimation only
const COST_PER_M: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5':  { input: 0.25, output: 1.25 },
  'gpt-4o':            { input: 2.5, output: 10.0 },
  'gpt-4o-mini':       { input: 0.15, output: 0.60 },
};

function estimateCostUsd(model: string, tokens: CompleteResponse['tokens']): number {
  const rates = COST_PER_M[model] ?? { input: 1.0, output: 5.0 };
  return (
    (tokens.prompt * rates.input + tokens.completion * rates.output) / 1_000_000
  );
}

function providerOf(model: string): string {
  return model.startsWith('claude-') ? 'anthropic' : 'openai';
}

export interface CostLogData {
  req: CompleteRequest;
  res: Pick<CompleteResponse, 'model' | 'tokens' | 'duration_ms' | 'fallback'>;
  success: boolean;
  errorCode?: string;
}

export async function writeCostLog(data: CostLogData): Promise<void> {
  const { req, res, success, errorCode } = data;
  const costUsd = estimateCostUsd(res.model, res.tokens);

  try {
    await prisma.costLog.create({
      data: {
        userId: req.metadata.userId,
        accountId: req.metadata.accountId,
        agentId: req.metadata.agentId,
        eventType: req.metadata.eventType ?? 'specialist_call',
        callType: 'complete',
        modelTier: req.model_tier,
        modelUsed: res.model,
        provider: providerOf(res.model),
        promptTokens: res.tokens.prompt,
        completionTokens: res.tokens.completion,
        totalTokens: res.tokens.total,
        costUsd: new Decimal(costUsd.toFixed(6)),
        durationMs: res.duration_ms,
        success,
        errorCode: errorCode ?? null,
        isFallback: !!res.fallback,
        fallbackFrom: res.fallback?.from ?? null,
        fallbackTo: res.fallback?.to ?? null,
        fallbackReason: res.fallback?.reason ? res.fallback.reason.slice(0, 128) : null,
        traceId: req.metadata.trace_id,
      },
    });
  } catch (err) {
    // cost_log failure must not crash the response — log and continue
    logger.error({ err, traceId: req.metadata.trace_id }, 'cost_log.write_failed');
  }
}
