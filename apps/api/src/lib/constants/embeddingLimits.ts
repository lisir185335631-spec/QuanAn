/**
 * Embedding (OpenAI text-embedding-3-small) limits and cost constants — PRD-9 US-001
 * D-038: independent worker, not via LLMGateway
 */

export const EMBEDDING_MAX_TOKENS = 8192;
export const EMBEDDING_DAILY_LIMIT_DEFAULT = 100;
export const EMBEDDING_TIMEOUT_MS = 30_000;
export const EMBEDDING_COST_USD_PER_1K_TOKENS = 0.00002; // $0.00002/1K tokens (text-embedding-3-small)
export const EMBEDDING_DIMENSIONS = 1536;
