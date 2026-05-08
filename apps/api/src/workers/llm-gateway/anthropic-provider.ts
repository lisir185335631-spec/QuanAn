/**
 * QuanQn · Anthropic request/response helpers (no SDK import — AC-7 R-1)
 * SDK import lives only in index.ts; these helpers work with raw typed data.
 */

import type { CompleteRequest, CompleteResponse } from './index';

export interface RawAnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  usage: { input_tokens: number; output_tokens: number };
  model: string;
  stop_reason: string | null;
}

/** Build the system + user message tuple for Anthropic create() call */
export function buildAnthropicPayload(model: string, req: CompleteRequest): {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  return {
    model,
    max_tokens: 4096,
    system: req.systemPrompt,
    messages: [{ role: 'user', content: req.userPrompt }],
  };
}

/** Parse Anthropic response into CompleteResponse */
export function parseAnthropicResponse(
  raw: RawAnthropicResponse,
  model: string,
  startedAt: number,
  req: CompleteRequest,
): CompleteResponse {
  const textBlock = raw.content.find((b) => b.type === 'text');
  const content = textBlock?.text ?? '';
  return {
    content,
    tokens: {
      prompt: raw.usage.input_tokens,
      completion: raw.usage.output_tokens,
      total: raw.usage.input_tokens + raw.usage.output_tokens,
    },
    model,
    duration_ms: Date.now() - startedAt,
    trace_id: req.metadata.trace_id,
  };
}

/** Determine provider from model name */
export function isAnthropicModel(model: string): boolean {
  return model.startsWith('claude-');
}
