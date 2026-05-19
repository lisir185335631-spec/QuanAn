/**
 * QuanAn · 9 步主流程
 * 派生自 ARCHITECTURE.md §2.2 + spec.md §Ⅹ.7
 *
 * ⚠️ 没有 step2 · 实测原版 404(spec §ⅩⅦ)
 */

export interface Step {
  key: string;
  label: string;
  emoji: string;
  menu: '创作' | '策划';
  /** 关联的 Specialist · 详见 ARCHITECTURE §4.3 */
  agentId: string;
  agentMode: string;
  /** localStorage key 模式 · §3.3 LD-010 */
  lsKeyName: string;
}

export const STEPS: readonly Step[] = [
  { key: 'step1',  label: '行业选择', emoji: '🎯', menu: '策划', agentId: 'PositioningAgent', agentMode: 'industry',   lsKeyName: 'step1' },
  { key: 'step3',  label: '账号包装', emoji: '📝', menu: '策划', agentId: 'BrandingAgent',    agentMode: 'packaging',  lsKeyName: 'step3_account_v3' },
  { key: 'step3b', label: '人设定制', emoji: '🎭', menu: '策划', agentId: 'BrandingAgent',    agentMode: 'persona',    lsKeyName: 'step3b_persona' },
  { key: 'step4',  label: '执行计划', emoji: '📅', menu: '策划', agentId: 'PositioningAgent', agentMode: 'execution',  lsKeyName: 'step4_execution_v2' },
  { key: 'step4b', label: '变现路径', emoji: '💰', menu: '策划', agentId: 'MonetizationAgent', agentMode: 'ladder',    lsKeyName: 'step4b_monetization' },
  { key: 'step5',  label: '爆款选题', emoji: '🔥', menu: '创作', agentId: 'TopicAgent',       agentMode: 'category',   lsKeyName: 'step5_topics_v2' },
  { key: 'step6',  label: '拍摄计划', emoji: '🎬', menu: '策划', agentId: 'VideoAgent',       agentMode: 'shooting',   lsKeyName: 'step6_shooting' },
  { key: 'step7',  label: '文案生成', emoji: '✍️', menu: '创作', agentId: 'CopywritingAgent', agentMode: 'step7',      lsKeyName: 'step7_copywriting' },
  { key: 'step8',  label: '直播策划', emoji: '📡', menu: '策划', agentId: 'LivestreamAgent',  agentMode: 'default',    lsKeyName: 'step8_livestream' },
] as const;

export const STEP_KEYS = STEPS.map((s) => s.key) as readonly string[];

export const STEP_BY_KEY: Record<string, Step> = STEPS.reduce(
  (acc, s) => ({ ...acc, [s.key]: s }),
  {} as Record<string, Step>,
);

/** LS key 工厂 · 详见 ADR-011 */
export function getStepLsKey(accountId: number, stepKey: string): string {
  const step = STEP_BY_KEY[stepKey];
  if (!step) throw new Error(`Unknown stepKey: ${stepKey}`);
  return `aiip_memory_acc_${accountId}_${step.lsKeyName}`;
}

if (STEPS.length !== 9) {
  throw new Error(`Expected 9 steps, got ${STEPS.length}`);
}
