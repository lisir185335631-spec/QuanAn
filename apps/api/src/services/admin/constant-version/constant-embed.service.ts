// PRD-14 US-007 · constant-embed.service.ts
// AC-2: rebuildConstantVectorIndex — embed new content + UPSERT knowledge_chunk
// AC-5: evaluateConstantVersion — LLM Judge stub (mirrors evaluatePromptVersion)
// SHIELD: embed 真调 LLMGateway · 写真实 cost_log · 不 stub (D-077 仅 LLM Judge / dingtalk)
// SHIELD: 失败 catch 不写 cost_log

import { createHash } from 'node:crypto';

import { Decimal } from '@prisma/client/runtime/library';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { llmGateway } from '@/workers/llm-gateway';

const EMBED_MODEL = 'openai-text-embedding-3-small';
const EMBED_COST_PER_1K_USD = 0.00002;

export interface ConstantEmbedResult {
  versionId: number;
  constantType: string;
  constantKey: string;
  durationMs: number;
}

// AC-2: rebuild vector index for a constant after version publish
export async function rebuildConstantVectorIndex(
  constantType: string,
  constantKey: string,
  newContent: string,
  versionId: number,
): Promise<ConstantEmbedResult> {
  const startMs = Date.now();

  // Call LLMGateway.embed — real cost path (SHIELD: not stub)
  let embedding: number[];
  try {
    embedding = await llmGateway.embed(newContent);
  } catch (err) {
    // SHIELD: failure — do NOT write cost_log
    logger.error({ err, constantType, constantKey, versionId }, 'constant_embed.llm_gateway_failed');
    throw err;
  }

  const durationMs = Date.now() - startMs;
  const estTokens = Math.ceil(newContent.length / 1.5);
  const costUsd = Math.ceil(estTokens / 1000) * EMBED_COST_PER_1K_USD;

  // UPSERT 对应 vec 表 (knowledge_chunk) by (type=constantType, title=constantKey)
  // metadata={versionId, updatedAt} per AC-2
  const chunkType =
    constantType === 'case' ? 'case' : constantType === 'formula' ? 'formula' : 'element';

  await prisma.$executeRawUnsafe(
    `INSERT INTO knowledge_chunk (type, title, content, metadata, embedding, tokens, created_at, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, $5::vector, $6, NOW(), NOW())
     ON CONFLICT (type, title)
     DO UPDATE SET
       content    = EXCLUDED.content,
       metadata   = EXCLUDED.metadata,
       embedding  = EXCLUDED.embedding,
       tokens     = EXCLUDED.tokens,
       updated_at = NOW()`,
    chunkType,
    constantKey,
    newContent,
    JSON.stringify({ versionId, updatedAt: new Date().toISOString() }),
    `[${embedding.join(',')}]`,
    estTokens,
  );

  // Write cost_log eventType='constant_embed_rebuild' · 真实 cost (SHIELD)
  try {
    await prisma.costLog.create({
      data: {
        accountId: null,
        agentId: 'ConstantEmbedService',
        eventType: 'constant_embed_rebuild',
        callType: 'embedding_call',
        modelTier: 'embedding',
        modelUsed: EMBED_MODEL,
        provider: 'openai',
        promptTokens: estTokens,
        completionTokens: 0,
        totalTokens: estTokens,
        audioSeconds: null,
        charactersIn: newContent.length,
        costUsd: new Decimal(costUsd.toFixed(6)),
        durationMs,
        traceId: `constant-embed-${versionId}-${createHash('md5').update(constantKey).digest('hex').slice(0, 8)}`,
      },
    });
  } catch (err) {
    logger.error({ err, versionId }, 'constant_embed.cost_log_write_failed');
  }

  logger.info({ versionId, constantType, constantKey, durationMs }, 'constant_embed.done');
  return { versionId, constantType, constantKey, durationMs };
}

export interface ConstantJudgeResult {
  versionId: number;
  score: number;
  isMock: boolean;
}

// AC-5: evaluateConstantVersion — mirror evaluatePromptVersion (PRD-13 US-003)
// D-077: mock mode default · real eval via GitHub Actions CI (PRR phase)
export async function evaluateConstantVersion(
  versionId: number,
  isMock: boolean = true,
): Promise<ConstantJudgeResult> {
  if (isMock) {
    const score = parseFloat((4.2 + Math.random() * 0.6).toFixed(2));

    await prisma.constantVersion.update({
      where: { id: versionId },
      data: { judgeScore: score },
    });

    return { versionId, score, isMock: true };
  }

  // Real LLM Judge deferred to PRR phase per D-077
  throw new Error('Real LLM Judge not implemented for constants (D-077: enable via GitHub Actions CI)');
}
