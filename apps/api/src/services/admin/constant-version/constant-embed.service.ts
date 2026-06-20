// PRD-14 US-007 · constant-embed.service.ts
// AC-2: rebuildConstantVectorIndex — embed new content + UPSERT knowledge_chunk
// AC-5: evaluateConstantVersion — LLM Judge stub (mirrors evaluatePromptVersion)
// SHIELD: embed 走 OpenAIEmbeddingWorker (D-038) · 不走 LLMGateway · 不 stub (D-077 仅 LLM Judge / dingtalk)
// SHIELD: 失败 catch 不写 cost_log
// NOTE: cost_log 由 OpenAIEmbeddingWorker 内部写 (embedding_call) · 本服务不重复写

import { createHash } from 'node:crypto';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { OpenAIEmbeddingWorker } from '@/workers/embedding/openai-embedding';

// System-level embedding worker (D-038: embeddings go through OpenAIEmbeddingWorker, not LLMGateway)
const embeddingWorker = new OpenAIEmbeddingWorker();

// System accountId for admin/background operations (no user context) — mirrors knowledge.ts:128
const SYSTEM_ACCOUNT_ID = 0;

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

  // traceId format mirrors constant_embed_rebuild log (constant-embed-{versionId}-{hash})
  const traceId = `constant-embed-${versionId}-${createHash('md5').update(constantKey).digest('hex').slice(0, 8)}`;

  // D-038: call OpenAIEmbeddingWorker directly · NOT llmGateway.embed
  // Worker internally writes cost_log (eventType='embedding_call') — no double-write here
  let embedding: number[];
  try {
    const result = await embeddingWorker.embed({
      text: newContent,
      accountId: SYSTEM_ACCOUNT_ID,
      traceId,
    });
    embedding = result.embedding;
  } catch (err) {
    // SHIELD: failure — do NOT write cost_log
    logger.error({ err, constantType, constantKey, versionId }, 'constant_embed.worker_failed');
    throw err;
  }

  const durationMs = Date.now() - startMs;
  const estTokens = Math.ceil(newContent.length / 1.5);

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
