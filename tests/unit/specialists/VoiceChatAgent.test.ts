/**
 * Unit tests — PRD-8 US-002
 * VoiceChatAgent: 骨架 happy stub throw + VOICE_CHAT_TOOLS export 校验
 * AC-10: 2 tests
 */

import { describe, it, expect } from 'vitest';

import { VoiceChatAgent, VoiceChatBufferSchema, VOICE_CHAT_TOOLS } from '@/specialists/VoiceChatAgent';

describe('VoiceChatAgent (US-002 骨架)', () => {
  it('execute() throws PRD-8 US-011 stub error', async () => {
    const agent = new VoiceChatAgent();
    await expect(
      agent.execute({ accountId: 1, userInput: { userMessage: '你好' } }),
    ).rejects.toThrow('PRD-8 US-011 真接');
  });

  it('outputSchema is VoiceChatBufferSchema and VOICE_CHAT_TOOLS has 5 tools', () => {
    const agent = new VoiceChatAgent();
    expect(agent.outputSchema).toBe(VoiceChatBufferSchema);
    expect(VOICE_CHAT_TOOLS).toHaveLength(5);
  });
});
