export interface StepMeta {
  title: string;
  description: string;
  phase: string;
}

export const stepConfig = new Map<string, StepMeta>([
  ['step1', { title: 'IP 定位与身份建立', description: '明确你的 IP 方向、目标受众和核心价值主张', phase: '定位' }],
  ['step3', { title: '内容策略制定', description: '规划内容体系、选题矩阵和爆款公式', phase: '策略' }],
  ['step3b', { title: '内容策略细化', description: '深化选题策略，构建内容日历和内容库', phase: '策略' }],
  ['step4', { title: '内容生产准备', description: '搭建内容生产 SOP，选型工具与工作流', phase: '生产' }],
  ['step4b', { title: '内容生产执行', description: '按 SOP 批量生产高质量内容', phase: '生产' }],
  ['step5', { title: '发布与运营', description: '多平台发布策略、最佳发布时间与互动运营', phase: '运营' }],
  ['step6', { title: '数据分析与复盘', description: '关键指标追踪、爆款复盘与迭代方向', phase: '分析' }],
  ['step7', { title: '变现规划', description: 'IP 变现路径设计，从流量到收益的转化模型', phase: '变现' }],
  ['step8', { title: '持续迭代与升级', description: '基于数据与用户反馈持续优化 IP 定位与内容', phase: '迭代' }],
]);
