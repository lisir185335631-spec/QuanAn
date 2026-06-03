/**
 * Specialist 注册表(热插拔)单测
 * 验证 SPECIALISTS 集中登记 + STEP_AGENT_REGISTRY 的 stepKey→agent 声明式映射等价于原 if 链。
 */
import { describe, it, expect } from 'vitest';

import { SPECIALISTS, STEP_AGENT_REGISTRY, findStepAgent } from '@/specialists/registry';

describe('specialist registry · 热插拔', () => {
  it('SPECIALISTS 集中登记了全部 13 个 specialist,且都有 execute', () => {
    const ids = Object.keys(SPECIALISTS) as (keyof typeof SPECIALISTS)[];
    expect(ids).toHaveLength(13);
    for (const id of ids) expect(typeof SPECIALISTS[id].execute).toBe('function');
  });

  it.each([
    ['step1', 'PositioningAgent'],
    ['step4', 'PositioningAgent'],
    ['step3', 'BrandingAgent'],
    ['step3b', 'BrandingAgent'],
    ['step4b', 'MonetizationAgent'],
    ['step6', 'VideoAgent'],
    ['step5', 'TopicAgent'],
    ['step5_traffic', 'TopicAgent'],
    ['step7', 'CopywritingAgent'],
    ['step8', 'LivestreamAgent'],
  ])('findStepAgent(%s) → %s', (stepKey, agentId) => {
    expect(findStepAgent(stepKey)?.agentId).toBe(agentId);
  });

  it('未注册的 stepKey 返回 undefined(该 step 不触发 agent)', () => {
    expect(findStepAgent('step2')).toBeUndefined();
    expect(findStepAgent('step99')).toBeUndefined();
  });

  it('resolveMode 正确解析各 step 的 mode(等价原 if 链)', () => {
    expect(findStepAgent('step1')?.resolveMode?.('step1', {})).toBe('industry');
    expect(findStepAgent('step4')?.resolveMode?.('step4', {})).toBe('execution');
    expect(findStepAgent('step3')?.resolveMode?.('step3', {})).toBe('packaging');
    expect(findStepAgent('step3b')?.resolveMode?.('step3b', {})).toBe('persona');
    expect(findStepAgent('step6')?.resolveMode?.('step6', {})).toBe('shooting');
    expect(findStepAgent('step7')?.resolveMode?.('step7', {})).toBe('step7');
    expect(findStepAgent('step8')?.resolveMode?.('step8', { sub_function: 'optimize_script' })).toBe(
      'optimize_script',
    );
    expect(findStepAgent('step8')?.resolveMode?.('step8', {})).toBe('generate_plan');
    // step4b/step5 无 mode
    expect(findStepAgent('step4b')?.resolveMode).toBeUndefined();
  });

  it('step5_<category>.buildUserInput 从 stepKey 后缀解析 category(回退 lastCategory→traffic)', () => {
    expect(findStepAgent('step5_case')?.buildUserInput?.({ foo: 1 }, 'step5_case')).toEqual({
      category: 'case',
      foo: 1,
    });
    expect(findStepAgent('step5')?.buildUserInput?.({ lastCategory: 'hot' }, 'step5')).toMatchObject({
      category: 'hot',
    });
    expect(findStepAgent('step5')?.buildUserInput?.({}, 'step5')).toMatchObject({ category: 'traffic' });
  });

  it('每条注册条目都具备分发所需最小契约(新增=加一条目即可)', () => {
    for (const e of STEP_AGENT_REGISTRY) {
      expect(typeof e.agentId).toBe('string');
      expect(typeof e.agent.execute).toBe('function');
      expect(typeof e.match).toBe('function');
    }
  });
});
