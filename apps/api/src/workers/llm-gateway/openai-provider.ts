/**
 * QuanQn · OpenAI request/response helpers (no SDK import — AC-8 R-1)
 * SDK import lives only in index.ts; these helpers work with raw typed data.
 */

import type { CompleteRequest, CompleteResponse } from './index';

export interface RawOpenAIResponse {
  choices: Array<{ message: { content: string | null } }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
}

/** Build the messages array for OpenAI chat.completions.create() */
export function buildOpenAIPayload(model: string, req: CompleteRequest): {
  model: string;
  max_tokens: number;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
} {
  return {
    model,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: req.systemPrompt },
      { role: 'user', content: req.userPrompt },
    ],
  };
}

/** Parse OpenAI response into CompleteResponse */
export function parseOpenAIResponse(
  raw: RawOpenAIResponse,
  model: string,
  startedAt: number,
  req: CompleteRequest,
): CompleteResponse {
  const content = raw.choices[0]?.message.content ?? '';
  return {
    content,
    tokens: {
      prompt: raw.usage?.prompt_tokens ?? 0,
      completion: raw.usage?.completion_tokens ?? 0,
      total: raw.usage?.total_tokens ?? 0,
    },
    model,
    duration_ms: Date.now() - startedAt,
    trace_id: req.metadata.trace_id,
  };
}
