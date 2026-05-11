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
  // Dev fallback: if OPENAI_API_KEY not configured, fall through to text search
  let queryEmbedding: number[];
  try {
    const result = await embeddingWorker.embed({ text: query, accountId, traceId });
    queryEmbedding = result.embedding;
  } catch (err) {
    // When OPENAI_API_KEY is not configured, fall back to text search (dev environments)
    if (
      err instanceof Error &&
      err.message === 'OPENAI_API_KEY not configured'
    ) {
      logger.info({ traceId }, 'rag.retrieve.text_search_fallback (no OPENAI_API_KEY)');
      return textSearchFallback({ query, topK, type, metadataFilter, traceId });
    }
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

/** Text search fallback when OPENAI_API_KEY is not set (dev/test environments) */
async function textSearchFallback(input: {
  query: string;
  topK?: number;
  type?: string;
  metadataFilter?: Record<string, unknown>;
  traceId: string;
}): Promise<KnowledgeChunkContent[]> {
  const { query, topK = 10, type, traceId } = input;
  const limit = Math.min(topK, 20);

  // Split query into keywords for partial matching
  const keywords = query
    .split(/[\s\u3000，,。.]+/)
    .filter((w) => w.length >= 1)
    .slice(0, 5);

  if (keywords.length === 0) return [];

  // Build ILIKE conditions — OR across all keywords, AND across title+content
  const likeClauses = keywords.map((_, i) => `(title ILIKE $${i + 1} OR content ILIKE $${i + 1})`).join(' OR ');
  const params: unknown[] = keywords.map((kw) => `%${kw}%`);

  const typeClauses: string[] = [];
  if (type) {
    params.push(type);
    typeClauses.push(`type = $${params.length}`);
  }

  params.push(limit);
  const whereSQL =
    typeClauses.length > 0
      ? `WHERE (${likeClauses}) AND ${typeClauses.join(' AND ')}`
      : `WHERE (${likeClauses})`;

  try {
    const rows = await prisma.$queryRawUnsafe<Omit<RawChunkRow, 'similarity'>[]>(
      `SELECT id, type, title, content, metadata, tokens
       FROM knowledge_chunk
       ${whereSQL}
       LIMIT $${params.length}`,
      ...params,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      type: row.type as 'case' | 'formula' | 'element',
      title: row.title,
      content: row.content,
      metadata: row.metadata as Record<string, unknown>,
      tokens: Number(row.tokens),
      similarity: 1.0, // text search score placeholder
    }));
  } catch (err) {
    logger.error({ err, traceId }, 'rag.retrieve.text_search_failed');
    return [];
  }
}

export const ragRetrieveWorker = { retrieve };
