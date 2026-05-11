/**
 * STT (Whisper-1) limits and cost constants — PRD-8 US-009
 * D-038: independent worker, not via LLMGateway
 */

export const STT_MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB (Whisper API hard limit)
export const STT_MAX_DURATION_SEC = 30;              // 30s cap per request
export const STT_COST_USD_PER_MIN = 0.006;           // $0.006/min (Whisper-1 pricing)
export const STT_DAILY_LIMIT_DEFAULT = 50;
export const STT_TIMEOUT_MS = 30_000;                // 30s hard timeout for Whisper call
