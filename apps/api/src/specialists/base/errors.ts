/**
 * QuanQn · PRD-4 Specialist 错误类
 * SchemaValidationError + LLMTimeoutError + FallbackTriggeredError
 * AC-3(US-001)
 */

export class SchemaValidationError extends Error {
  readonly issues: string;

  constructor(issues: string) {
    super(`Schema validation failed: ${issues}`);
    this.name = 'SchemaValidationError';
    this.issues = issues;
  }
}

export class LLMTimeoutError extends Error {
  readonly agentId: string;
  readonly timeoutMs: number;

  constructor(agentId: string, timeoutMs: number) {
    super(`LLM call for ${agentId} timed out after ${timeoutMs}ms`);
    this.name = 'LLMTimeoutError';
    this.agentId = agentId;
    this.timeoutMs = timeoutMs;
  }
}

export class FallbackTriggeredError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(`Fallback triggered: ${reason}`);
    this.name = 'FallbackTriggeredError';
    this.reason = reason;
  }
}
