/**
 * Unit tests — PRD-8 US-002
 * EvolutionAgent: 骨架 happy stub throw + schema getter 校验
 * AC-10: 2 tests
 */

import { describe, it, expect } from 'vitest';

import { EvolutionAgent, EvolutionInsightContentSchema } from '@/specialists/EvolutionAgent';

describe('EvolutionAgent (US-002 骨架)', () => {
  it('execute() throws PRD-8 US-003 stub error', async () => {
    const agent = new EvolutionAgent();
    await expect(
      agent.execute({ accountId: 1, userInput: { accountId: 1, triggerType: 'threshold:5' } }),
    ).rejects.toThrow('PRD-8 US-003 真接');
  });

  it('outputSchema is EvolutionInsightContentSchema', () => {
    const agent = new EvolutionAgent();
    expect(agent.outputSchema).toBe(EvolutionInsightContentSchema);
  });
});
