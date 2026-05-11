/* eslint-disable no-console -- one-shot CLI seed script · intentional stdout */
/**
 * seed-knowledge-chunk.ts — PRD-9 US-002
 * 把 67 案例 + 23 公式 + 23 元素 批量 ingest 到 KnowledgeChunk 表
 * (HOT_ELEMENTS 实测 23 项 · PRD-9 doc 写 22 是 PRD doc-only drift · TD 已登记)
 * upsert by (type, title) 幂等 · cost_log embedding_call 每条 1 行
 *
 * Usage:
 *   pnpm seed:knowledge [--dry-run]
 */

// AC-4: 在任何模块加载前设置高限额，允许 seed 用 accountId=0 超过默认 100/day
process.env['EMBEDDING_DAILY_LIMIT_PER_USER'] = '200';

import { KNOWLEDGE_CASES } from '../src/lib/constants/cases';
import { EMBEDDING_COST_USD_PER_1K_TOKENS } from '../src/lib/constants/embeddingLimits';
import { COPY_FORMULAS } from '../src/lib/constants/formulas';
import { HOT_ELEMENTS } from '../src/lib/constants/hotElements';
import { prisma } from '../src/lib/prisma';
import { OpenAIEmbeddingWorker } from '../src/workers/embedding';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeedChunk {
  type: 'case' | 'formula' | 'element';
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

// ── Build chunk list ─────────────────────────────────────────────────────────

/** Exported for integration tests — AC-7 */
export function buildChunks(): SeedChunk[] {
  const chunks: SeedChunk[] = [];

  // 67 cases
  for (const c of KNOWLEDGE_CASES) {
    chunks.push({
      type: 'case',
      title: c.title,
      content: `${c.title}\n${c.content}`,
      metadata: {
        scriptType: c.scriptType,
        industry: c.industry,
        elements: c.elements,
        viralPotential: c.viralPotential,
      },
    });
  }

  // 23 formulas
  for (const f of COPY_FORMULAS) {
    chunks.push({
      type: 'formula',
      title: f.title,
      content: `${f.title}\n${f.content}`,
      metadata: { category: f.category },
    });
  }

  // 22 elements
  for (const e of HOT_ELEMENTS) {
    chunks.push({
      type: 'element',
      title: e.label,
      content: `${e.label}（${e.group}）\n${e.psychology}`,
      metadata: { psychologyTag: e.key, group: e.group },
    });
  }

  return chunks;
}

// ── Dry-run ───────────────────────────────────────────────────────────────────

function dryRun(chunks: SeedChunk[]): void {
  const byType = { case: 0, formula: 0, element: 0 };
  let totalEstTokens = 0;

  for (const c of chunks) {
    byType[c.type]++;
    // Rough token estimate: Chinese chars ~1.5 chars/token
    totalEstTokens += Math.ceil(c.content.length / 1.5);
  }

  const estCost = (totalEstTokens / 1000) * EMBEDDING_COST_USD_PER_1K_TOKENS;

  console.log('=== seed-knowledge-chunk DRY-RUN ===');
  console.log(`Total chunks     : ${chunks.length} (case=${byType.case} / formula=${byType.formula} / element=${byType.element})`);
  console.log(`Est. tokens      : ~${totalEstTokens.toLocaleString()}`);
  console.log(`Est. cost        : ~$${estCost.toFixed(6)}`);
  console.log('No API calls made in dry-run mode.');
}

// ── Real seed ────────────────────────────────────────────────────────────────

const SEED_ACCOUNT_ID = 0; // system seed account

/** Exported for integration tests — AC-7 */
export async function seedChunks(chunks: SeedChunk[]): Promise<void> {
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);
  const worker = hasApiKey ? new OpenAIEmbeddingWorker() : null;

  if (!hasApiKey) {
    console.log('⚠️  OPENAI_API_KEY not set — inserting chunks without embeddings (text-search-only mode)');
  }

  let totalCostUsd = 0;
  let totalTokens = 0;
  let upserted = 0;

  console.log(`=== seed-knowledge-chunk START (${chunks.length} chunks) ===`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const traceId = `seed-knowledge-${chunk.type}-${i}`;

    if (worker) {
      // AC-2: call embeddingWorker.embed (when API key is available)
      const { embedding, tokens, costUsd } = await worker.embed({
        text: chunk.content,
        accountId: SEED_ACCOUNT_ID,
        traceId,
      });

      totalTokens += tokens;
      totalCostUsd += costUsd;

      // AC-2: upsert by composite key (type + title)
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
        chunk.type,
        chunk.title,
        chunk.content,
        JSON.stringify(chunk.metadata),
        `[${embedding.join(',')}]`,
        tokens,
      );
    } else {
      // Dev/CI mode: insert without embedding — text-search fallback handles retrieval
      const estTokens = Math.ceil(chunk.content.length / 1.5);
      totalTokens += estTokens;

      await prisma.$executeRawUnsafe(
        `INSERT INTO knowledge_chunk (type, title, content, metadata, tokens, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, NOW(), NOW())
         ON CONFLICT (type, title)
         DO UPDATE SET
           content    = EXCLUDED.content,
           metadata   = EXCLUDED.metadata,
           tokens     = EXCLUDED.tokens,
           updated_at = NOW()`,
        chunk.type,
        chunk.title,
        chunk.content,
        JSON.stringify(chunk.metadata),
        estTokens,
      );
    }

    upserted++;

    if (upserted % 10 === 0 || upserted === chunks.length) {
      process.stdout.write(`\r  Progress: ${upserted}/${chunks.length} chunks`);
    }
  }

  console.log('\n');
  console.log('=== seed-knowledge-chunk COMPLETE ===');
  console.log(`Upserted   : ${upserted} chunks`);
  console.log(`Total tokens: ${totalTokens.toLocaleString()} (${hasApiKey ? 'real' : 'estimated'})`);
  console.log(`Total cost : $${totalCostUsd.toFixed(6)}`);
  if (upserted > 0) {
    console.log(`Avg cost   : $${(totalCostUsd / upserted).toFixed(6)}/chunk`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');
  const chunks = buildChunks();

  if (isDryRun) {
    dryRun(chunks);
    return;
  }

  await seedChunks(chunks);
  await prisma.$disconnect();
}

// Only run when executed directly (not imported by tests)
const scriptPath = process.argv[1] ?? '';
if (scriptPath.includes('seed-knowledge-chunk')) {
  main().catch((err) => {
    console.error('seed-knowledge-chunk failed:', err);
    process.exit(1);
  });
}
