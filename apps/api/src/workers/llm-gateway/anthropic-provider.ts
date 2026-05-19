/**
 * QuanAn · Anthropic request/response helpers (no SDK import — AC-7 R-1)
 * SDK import lives only in index.ts; these helpers work with raw typed data.
 *
 * US-003 AC-2: responseFormat.type='json_schema' → tool_use mode
 *   buildAnthropicPayload adds tools/tool_choice to force structured JSON
 *   parseAnthropicResponse extracts tool_use input block as content
 */

import type { CompleteRequest, CompleteResponse } from './index';

export interface RawAnthropicResponse {
  content: Array<{ type: string; text?: string; input?: unknown; name?: string }>;
  usage: { input_tokens: number; output_tokens: number };
  model: string;
  stop_reason: string | null;
}

type AnthropicMessages = Array<{ role: 'user' | 'assistant'; content: string }>;

interface AnthropicBasicPayload {
  model: string;
  max_tokens: number;
  system: string;
  messages: AnthropicMessages;
  tools?: Array<{
    name: string;
    description: string;
    input_schema: { type: 'object'; additionalProperties: boolean };
  }>;
  tool_choice?: { type: 'tool'; name: string };
}

/** Build the system + user message tuple for Anthropic create() call */
export function buildAnthropicPayload(
  model: string,
  req: CompleteRequest,
): AnthropicBasicPayload {
  const base: AnthropicBasicPayload = {
    model,
    max_tokens: 4096,
    system: req.systemPrompt,
    messages: [{ role: 'user', content: req.userPrompt }],
  };

  // AC-2: json_schema responseFormat → tool_use mode to force structured output
  if (req.responseFormat?.type === 'json_schema') {
    return {
      ...base,
      tools: [
        {
          name: 'structured_output',
          description: 'Return structured output matching the required schema exactly.',
          input_schema: { type: 'object', additionalProperties: true },
        },
      ],
      tool_choice: { type: 'tool', name: 'structured_output' },
    };
  }

  return base;
}

/** Parse Anthropic response into CompleteResponse */
export function parseAnthropicResponse(
  raw: RawAnthropicResponse,
  model: string,
  startedAt: number,
  req: CompleteRequest,
): CompleteResponse {
  // AC-2: tool_use response has structured input object
  const toolBlock = raw.content.find((b) => b.type === 'tool_use' && b.name === 'structured_output');
  const textBlock = raw.content.find((b) => b.type === 'text');

  const content: string | object = toolBlock
    ? (toolBlock.input as object)
    : (textBlock?.text ?? '');

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
