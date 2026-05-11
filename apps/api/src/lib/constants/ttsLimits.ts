/**
 * TTS (OpenAI TTS-1) limits and cost constants — PRD-8 US-010
 * D-038: independent worker, not via LLMGateway
 */

export const TTS_MAX_CHARS = 4000;
export const TTS_DAILY_LIMIT_DEFAULT = 100;
export const TTS_TIMEOUT_MS = 30_000;
export const TTS_COST_USD_PER_1K_CHARS = 0.015; // $0.015/1K chars (TTS-1 pricing)
