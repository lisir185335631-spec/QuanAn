// @quanqn/schemas · zod schema 真理来源
// · entities/        · 15 业务实体(主应用)
// · step-results/    · 9 step result schema
// · specialist-io/   · 14 Specialist 输入输出
// · admin/           · 13 admin 业务管理域 schema(P9.0 起填)
//
// 注意 · barrel export 会触发 tree-shaking 风险 · 后续 P1 实施期可拆细 · 当前 P0 占位

export * from './entities/ipAccount.schema';
export * from './entities/stepData.schema';

// PRD-6 US-001 · 5 video-domain schemas (video-prefixed avoid name collision)
export * from './specialist-io/videoProduction.schema';
export * from './specialist-io/acquisitionVideo.schema';
export * from './specialist-io/aiVideo.schema';
export * from './specialist-io/acquisitionCopywriting.schema';
export * from './specialist-io/imageGen.schema';

// PRD-9 US-001 · RAG 知识库 schemas
export type {
  KnowledgeChunkContent,
  KnowledgeChunkTypeValue,
  CaseMetadata,
  FormulaMetadata,
  ElementMetadata,
  RagRetrieveParams,
} from './rag';
export {
  KnowledgeChunkType,
  knowledgeChunkContentSchema,
  ragRetrieveParamsSchema,
  caseMetadataSchema,
  formulaMetadataSchema,
  elementMetadataSchema,
} from './rag';
