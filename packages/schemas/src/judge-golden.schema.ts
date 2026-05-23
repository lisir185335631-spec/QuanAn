/**
 * QuanAn · PRD-28 US-004 · GoldenSample + GoldenDataset zod schema
 * D-266: 100 条金标准 dataset · 双轨 sally-30 + custom-70
 */

import { z } from 'zod';

// ── 14 Specialist enum (AGENTS.md LD-002 canonical list) ─────────────────────

export const SPECIALIST_IDS = [
  'PositioningAgent',
  'BrandingAgent',
  'MonetizationAgent',
  'TopicAgent',
  'CopywritingAgent',
  'VideoAgent',
  'LivestreamAgent',
  'PrivateDomainAgent',
  'AnalysisAgent',
  'DiagnosisAgent',
  'DeepLearnAgent',
  'PresentationAgent',
  'EvolutionAgent',
  'DailyTaskAgent',
] as const;

export type SpecialistId = (typeof SPECIALIST_IDS)[number];

// ── GoldenSample schema ───────────────────────────────────────────────────────

export const goldenSampleSchema = z.object({
  id: z.string().regex(/^(sally|custom)-\d{3}$/, 'id must match (sally|custom)-NNN pattern'),
  specialistId: z.enum(SPECIALIST_IDS),
  mode: z.string().optional(),
  input: z.record(z.string(), z.unknown()),
  expectedOutputPattern: z.record(z.string(), z.unknown()).optional(),
  criteria: z.array(z.string()).min(2, 'criteria must have at least 2 items'),
  expectedKeyFields: z.array(z.string()).min(1, 'expectedKeyFields must have at least 1 item'),
  source: z.enum(['sally', 'custom']),
  tags: z.array(z.string()).optional(),
});

export type GoldenSample = z.infer<typeof goldenSampleSchema>;

// ── GoldenDataset schema ──────────────────────────────────────────────────────

export const goldenDatasetSchema = z.array(goldenSampleSchema);

export type GoldenDataset = z.infer<typeof goldenDatasetSchema>;
