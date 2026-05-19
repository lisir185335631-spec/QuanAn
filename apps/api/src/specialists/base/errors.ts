/**
 * QuanAn · PRD-4 Specialist 错误类
 * SchemaValidationError + LLMTimeoutError + FallbackTriggeredError
 * AC-3(US-001) · AC-3(US-003 retry: ZodError + llmRawOutput)
 */

import type { z } from 'zod';

export class SchemaValidationError extends Error {
  readonly issues: string;
  readonly zodError?: z.ZodError;
  readonly llmRawOutput?: unknown;

  constructor(zodErrorOrMsg: z.ZodError | string, llmRawOutput?: unknown) {
    const issues =
      typeof zodErrorOrMsg === 'string' ? zodErrorOrMsg : zodErrorOrMsg.message;
    super(`Schema validation failed: ${issues}`);
    this.name = 'SchemaValidationError';
    this.issues = issues;
    if (typeof zodErrorOrMsg !== 'string') {
      this.zodError = zodErrorOrMsg;
    }
    this.llmRawOutput = llmRawOutput;
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
