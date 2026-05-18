export interface WorkflowStep {
  num: string;
  title: string;
  desc: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { num: '01', title: '选择行业', desc: '56 行业精准匹配' },
  { num: '02', title: '账号包装', desc: 'AI 生成完整方案' },
  { num: '03', title: '变现设计', desc: '三阶梯路径规划' },
  { num: '04', title: '学爆款', desc: '全网爆款实时追踪' },
  { num: '05', title: '生成文案', desc: '22 元素一键创作' },
  { num: '06', title: '制作视频', desc: '分镜表自动生成' },
  { num: '07', title: '私域转化', desc: '六大阶段话术覆盖' },
];
