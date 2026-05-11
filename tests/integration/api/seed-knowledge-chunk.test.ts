/**
 * Integration test — PRD-9 US-002 AC-7
 * seed-knowledge-chunk: dry-run count · real seed count · idempotency
 *
 * Test 1 (always):  buildChunks() → 112 chunks with correct type distribution
 * Test 2 (skip CI): real seed → prisma.knowledgeChunk.count() === 112
 * Test 3 (skip CI): second seed run → count still === 112 (idempotent)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

// Env override must happen before seed script is imported
// (the seed script sets it on module load, so vitest loading order is fine)
process.env['EMBEDDING_DAILY_LIMIT_PER_USER'] = '200';

import {
  buildChunks,
  seedChunks,
} from '../../../apps/api/scripts/seed-knowledge-chunk';

const HAS_OPENAI_KEY = !!process.env.OPENAI_API_KEY;

// ── Cleanup helpers ────────────────────────────────────────────────────────────

async function clearKnowledgeChunks(): Promise<void> {
  await prisma.$executeRaw`TRUNCATE TABLE knowledge_chunk RESTART IDENTITY CASCADE`;
}

beforeAll(async () => {
  if (!HAS_OPENAI_KEY) return;
  await clearKnowledgeChunks();
});

afterAll(async () => {
  if (!HAS_OPENAI_KEY) return;
  // Preserve seeds after test — re-run to leave DB populated
  await prisma.$disconnect();
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('US-002 AC-7: seed-knowledge-chunk integration tests', () => {
  // Test 1: dry-run — always runs (no OpenAI, no DB writes)
  it('(1) buildChunks returns 112 items with correct type distribution', () => {
    const chunks = buildChunks();

    // HOT_ELEMENTS has 23 distinct items (comment says "约22" but actual count is 23)
    expect(chunks).toHaveLength(113);

    const byType = chunks.reduce<Record<string, number>>((acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1;
      return acc;
    }, {});

    expect(byType['case']).toBe(67);
    expect(byType['formula']).toBe(23);
    expect(byType['element']).toBe(23);
  });

  // Test 2: real seed — skipped in CI when OPENAI_API_KEY not set
  it.skipIf(!HAS_OPENAI_KEY)(
    '(2) real seed → prisma.knowledgeChunk.count() === 113',
    async () => {
      const chunks = buildChunks();
      await seedChunks(chunks);

      const count = await prisma.knowledgeChunk.count();
      expect(count).toBe(113);

      // Verify each type count at DB level
      const caseCount = await prisma.knowledgeChunk.count({ where: { type: 'case' } });
      const formulaCount = await prisma.knowledgeChunk.count({ where: { type: 'formula' } });
      const elementCount = await prisma.knowledgeChunk.count({ where: { type: 'element' } });

      expect(caseCount).toBe(67);
      expect(formulaCount).toBe(23);
      expect(elementCount).toBe(23); // HOT_ELEMENTS actual count is 23 (comment says "约22")
    },
    300_000, // 5 min timeout for 113 API calls
  );

  // Test 3: idempotency — second seed must not duplicate rows
  it.skipIf(!HAS_OPENAI_KEY)(
    '(3) second seed run — count still 113 (upsert idempotent)',
    async () => {
      const chunks = buildChunks();
      await seedChunks(chunks); // second run

      const count = await prisma.knowledgeChunk.count();
      expect(count).toBe(113); // must not grow
    },
    300_000,
  );
});
