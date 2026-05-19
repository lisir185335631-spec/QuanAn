/**
 * QuanAn · OpenAI request/response helpers (no SDK import — AC-8 R-1)
 * SDK import lives only in index.ts; these helpers work with raw typed data.
 *
 * US-003 AC-2: responseFormat.type='json_schema' → response_format.type='json_object'
 *   Forces OpenAI to return valid JSON; Zod validation in BaseSpecialist handles schema enforcement.
 */

import type { CompleteRequest, CompleteResponse } from './index';

export interface RawOpenAIResponse {
  choices: Array<{ message: { content: string | null } }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
}

interface OpenAIBasicPayload {
  model: string;
  max_tokens: number;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  response_format?: { type: 'json_object' };
}

/** Build the messages array for OpenAI chat.completions.create() */
export function buildOpenAIPayload(model: string, req: CompleteRequest): OpenAIBasicPayload {
  const base: OpenAIBasicPayload = {
    model,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: req.systemPrompt },
      { role: 'user', content: req.userPrompt },
    ],
  };

  // AC-2: json_schema responseFormat → json_object mode
  if (req.responseFormat?.type === 'json_schema') {
    return { ...base, response_format: { type: 'json_object' } };
  }

  return base;
}

/** Parse OpenAI response into CompleteResponse */
export function parseOpenAIResponse(
  raw: RawOpenAIResponse,
  model: string,
  startedAt: number,
  req: CompleteRequest,
): CompleteResponse {
  const rawStr = raw.choices[0]?.message.content ?? '';

  // AC-2: if json_object mode, parse JSON string → object for schema validation
  let content: string | object = rawStr;
  if (req.responseFormat?.type === 'json_schema') {
    try {
      content = JSON.parse(rawStr) as object;
    } catch {
      // leave as string; BaseSpecialist Zod validation will catch the mismatch
    }
  }

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
