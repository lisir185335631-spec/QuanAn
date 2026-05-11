/**
 * RAG 知识库 Zod schemas — PRD-9 US-001
 * D-047 canonical SoT: packages/schemas > specialists > routers
 * D-057: KnowledgeChunk 单表 + type discriminator
 */

import { z } from 'zod';

// ── KnowledgeChunkType ─────────────────────────────────────────────────────────

export const KnowledgeChunkType = {
  CASE: 'case',
  FORMULA: 'formula',
  ELEMENT: 'element',
} as const satisfies Record<string, string>;

export type KnowledgeChunkTypeValue = (typeof KnowledgeChunkType)[keyof typeof KnowledgeChunkType];

// ── Metadata schemas per type ─────────────────────────────────────────────────

export const caseMetadataSchema = z.object({
  scriptType: z.string(),
  industry: z.string(),
});
export type CaseMetadata = z.infer<typeof caseMetadataSchema>;

export const formulaMetadataSchema = z.object({
  category: z.string(),
});
export type FormulaMetadata = z.infer<typeof formulaMetadataSchema>;

export const elementMetadataSchema = z.object({
  psychologyTag: z.string(),
  group: z.string(),
});
export type ElementMetadata = z.infer<typeof elementMetadataSchema>;

// ── KnowledgeChunkContent ─────────────────────────────────────────────────────

export const knowledgeChunkContentSchema = z.object({
  id: z.number(),
  type: z.enum(['case', 'formula', 'element']),
  title: z.string(),
  content: z.string(),
  metadata: z.record(z.unknown()),
  tokens: z.number(),
  similarity: z.number().min(0).max(1).optional(),
});

export type KnowledgeChunkContent = z.infer<typeof knowledgeChunkContentSchema>;

// ── RagRetrieveParams ─────────────────────────────────────────────────────────

export const ragRetrieveParamsSchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().min(1).max(50).default(5),
  type: z.enum(['case', 'formula', 'element']).optional(),
  metadataFilter: z.record(z.unknown()).optional(),
});

export type RagRetrieveParams = z.infer<typeof ragRetrieveParamsSchema>;
