/**
 * RagRetrieveWorker — PRD-9 US-001 AC-6
 * D-057: pgvector `<=>` cosine distance top-K
 * Calls EmbeddingWorker for query embedding, then prisma.$queryRaw
 */

import { TRPCError } from '@trpc/server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { OpenAIEmbeddingWorker } from '@/workers/embedding/openai-embedding';

import type { KnowledgeChunkContent, RagRetrieveParams } from '@quanqn/schemas';

const embeddingWorker = new OpenAIEmbeddingWorker();

interface RetrieveInput extends RagRetrieveParams {
  accountId: number;
  traceId: string;
}

type RawChunkRow = {
  id: bigint | number;
  type: string;
  title: string;
  content: string;
  metadata: unknown;
  tokens: bigint | number;
  similarity: number;
};

async function retrieve(input: RetrieveInput): Promise<KnowledgeChunkContent[]> {
  const { query, topK, type, metadataFilter, accountId, traceId } = input;

  // Step 1: get query embedding via EmbeddingWorker
  let queryEmbedding: number[];
  try {
    const result = await embeddingWorker.embed({ text: query, accountId, traceId });
    queryEmbedding = result.embedding;
  } catch (err) {
    logger.error({ err, traceId }, 'rag.retrieve.embedding_failed');
    throw err;
  }

  const vectorLiteral = `[${queryEmbedding.join(',')}]`;

  // Step 2: build WHERE clauses
  const whereClauses: string[] = [];
  const params: unknown[] = [vectorLiteral, topK];

  if (type) {
    params.push(type);
    whereClauses.push(`type = $${params.length}`);
  }

  if (metadataFilter && Object.keys(metadataFilter).length > 0) {
    params.push(JSON.stringify(metadataFilter));
    whereClauses.push(`metadata @> $${params.length}::jsonb`);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Step 3: pgvector cosine distance top-K
  // AC-6: uses <=> operator · similarity = 1 - cosine_distance
  try {
    const rows = await prisma.$queryRawUnsafe<RawChunkRow[]>(
      `SELECT id, type, title, content, metadata, tokens,
              1 - (embedding <=> $1::vector) AS similarity
       FROM knowledge_chunk
       ${whereSQL}
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      ...params,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      type: row.type as 'case' | 'formula' | 'element',
      title: row.title,
      content: row.content,
      metadata: row.metadata as Record<string, unknown>,
      tokens: Number(row.tokens),
      similarity: Number(row.similarity),
    }));
  } catch (err) {
    logger.error({ err, traceId }, 'rag.retrieve.query_failed');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'RAG 检索失败，请稍后重试',
      cause: err,
    });
  }
}

export const ragRetrieveWorker = { retrieve };
