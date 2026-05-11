/**
 * Unit tests — PRD-8 US-002
 * DailyTaskAgent: 骨架 happy stub throw + schema getter 校验
 * AC-10: 2 tests
 */

import { describe, it, expect } from 'vitest';

import { DailyTaskAgent, DailyTaskOutputSchema } from '@/specialists/DailyTaskAgent';

describe('DailyTaskAgent (US-002 骨架)', () => {
  it('execute() throws PRD-8 US-007 stub error', async () => {
    const agent = new DailyTaskAgent();
    await expect(
      agent.execute({ accountId: 1, userInput: { accountId: 1 } }),
    ).rejects.toThrow('PRD-8 US-007 真接');
  });

  it('outputSchema is DailyTaskOutputSchema', () => {
    const agent = new DailyTaskAgent();
    expect(agent.outputSchema).toBe(DailyTaskOutputSchema);
  });
});
