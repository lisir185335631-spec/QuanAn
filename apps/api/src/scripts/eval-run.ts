/**
 * QuanAn · PRD-28 US-005 · Evaluation CLI
 * Usage: pnpm --filter @quanan/api eval:run [--samples=N] [--specialist=X] [--source=sally|custom]
 * AC-5: no KEY → exit 1; with KEY → write 1 run + N samples
 * AC-6: --specialist=X → filter by specialistId
 * AC-7: --source=sally → only sally-30 samples
 * AC-9: missing KEY → exit 1; single sample fail → judgePass=false, no block; all fail → status='failed'
 */

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Decimal } from '@prisma/client/runtime/library';
import { goldenDatasetSchema } from '@quanan/schemas';

import { runSampleEvaluation } from '@/evaluation/evaluator';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

import type { GoldenSample } from '@quanan/schemas';

// ── Parse CLI args ────────────────────────────────────────────────────────────

function parseArgs(): { samples: number; specialist?: string; source?: 'sally' | 'custom' } {
  const args = process.argv.slice(2);
  let samples = 5;
  let specialist: string | undefined;
  let source: 'sally' | 'custom' | undefined;

  for (const arg of args) {
    const samplesMatch = arg.match(/^--samples=(\d+)$/);
    if (samplesMatch?.[1]) { samples = parseInt(samplesMatch[1], 10); continue; }

    const specialistMatch = arg.match(/^--specialist=(.+)$/);
    if (specialistMatch) { specialist = specialistMatch[1]; continue; }

    const sourceMatch = arg.match(/^--source=(sally|custom)$/);
    if (sourceMatch) { source = sourceMatch[1] as 'sally' | 'custom'; continue; }
  }

  return { samples, specialist, source };
}

// ── Load golden dataset ───────────────────────────────────────────────────────

function loadDataset(source?: 'sally' | 'custom'): GoldenSample[] {
  const root = resolve(__dirname, '../../../../tests/fixtures/judge-goldens');
  const datasets: GoldenSample[] = [];

  const files = source === 'sally'
    ? ['sally-30.json']
    : source === 'custom'
      ? ['custom-70.json']
      : ['sally-30.json', 'custom-70.json'];

  for (const file of files) {
    const raw = JSON.parse(readFileSync(resolve(root, file), 'utf-8')) as unknown;
    const parsed = goldenDatasetSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid dataset ${file}: ${parsed.error.message}`);
    }
    datasets.push(...parsed.data);
  }

  return datasets;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // AC-9: check API key before anything else
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error('[eval:run] ERROR: No LLM API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
    process.exit(1);
  }

  const { samples: sampleCount, specialist, source } = parseArgs();

  // Load + filter dataset
  let dataset = loadDataset(source);

  if (specialist) {
    dataset = dataset.filter((s) => s.specialistId === specialist);
    if (dataset.length === 0) {
      console.error(`[eval:run] No samples found for specialist: ${specialist}`);
      process.exit(1);
    }
  }

  // Pick up to sampleCount samples (round-robin across dataset if fewer available)
  const selected: GoldenSample[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const item = dataset[i % dataset.length];
    if (item) selected.push(item);
  }

  // Determine modelTier and model from first specialist config (approximate)
  const modelTier = 'balanced';
  const model = 'claude-sonnet-4-6';

  const runId = randomUUID();
  const startedAt = new Date();

  logger.info({ runId, sampleCount: selected.length, specialist, source }, 'eval:run started');

  // Create EvaluationRun record (status=running)
  await prisma.evaluationRun.create({
    data: {
      runId,
      startedAt,
      totalSamples: selected.length,
      passedSamples: 0,
      failedSamples: 0,
      skippedSamples: 0,
      modelTier,
      model,
      totalTokens: 0,
      totalCostUsd: new Decimal('0'),
      status: 'running',
    },
  });

  let passedSamples = 0;
  let failedSamples = 0;
  let totalTokens = 0;
  let totalCost = 0;
  const scores: number[] = [];

  // Run each sample — AC-9: single fail writes judgePass=false, doesn't block
  for (const sample of selected) {
    let result;
    try {
      result = await runSampleEvaluation(sample);
    } catch (err) {
      logger.warn({ goldenId: sample.id, err }, 'eval:run sample error — marking as failed');
      failedSamples++;

      await prisma.evaluationSample.create({
        data: {
          runId,
          goldenId: sample.id,
          specialistId: sample.specialistId,
          mode: sample.mode ?? null,
          input: sample.input as object,
          actualOutput: {},
          judgeScore: 0,
          judgePass: false,
          judgeReason: err instanceof Error ? err.message : String(err),
          structurePass: false,
          durationMs: 0,
          tokensUsed: 0,
          costUsd: new Decimal('0'),
        },
      });
      continue;
    }

    if (result.judgePass) passedSamples++;
    else failedSamples++;

    totalTokens += result.tokensUsed;
    totalCost += result.costUsd;
    scores.push(result.judgeScore);

    await prisma.evaluationSample.create({
      data: {
        runId,
        goldenId: sample.id,
        specialistId: sample.specialistId,
        mode: sample.mode ?? null,
        input: sample.input as object,
        actualOutput: result.actualOutput as object,
        judgeScore: result.judgeScore,
        judgePass: result.judgePass,
        judgeReason: result.judgeReason,
        structurePass: result.structurePass,
        durationMs: result.durationMs,
        tokensUsed: result.tokensUsed,
        costUsd: new Decimal(result.costUsd.toFixed(6)),
      },
    });

    logger.info(
      { goldenId: sample.id, specialistId: sample.specialistId, judgeScore: result.judgeScore, judgePass: result.judgePass },
      'eval:run sample done',
    );
  }

  const avgScore =
    scores.length > 0
      ? new Decimal((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : null;

  // AC-9: all fail → status='failed'
  const status = failedSamples === selected.length ? 'failed' : 'completed';

  await prisma.evaluationRun.update({
    where: { runId },
    data: {
      finishedAt: new Date(),
      passedSamples,
      failedSamples,
      avgScore,
      totalTokens,
      totalCostUsd: new Decimal(totalCost.toFixed(4)),
      status,
    },
  });

  logger.info(
    { runId, status, passedSamples, totalSamples: selected.length, avgScore: avgScore?.toString() ?? 'n/a' },
    'eval:run done',
  );
}

main().catch((err) => {
  console.error('[eval:run] Fatal error:', err);
  process.exit(1);
});
