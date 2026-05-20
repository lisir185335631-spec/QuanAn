/**
 * PRD-24 US-001 · /daily-tasks stub constants
 * AC-2: DAILY_TASKS_STUB 字面包含 spec §8.5.2 line 2438-2440
 */

export interface DailyTask {
  id: string
  title: string
  hint: string
  link?: string
}

export const DAILY_TASKS_STUB: readonly DailyTask[] = [
  { id: 'publish-step7', title: '今天发布 1 条 step/7 生成的文案', hint: '前往 /step/7 生成或选已有文案发布', link: '/step/7' },
  { id: 'optimize-step3', title: '优化 step/3 的简介', hint: '回顾账号包装方案 · 检查简介字数和关键词', link: '/step/3' },
  { id: 'reply-comments', title: '回复粉丝评论 X 条', hint: '保持互动率 · 提升账号活跃度', link: '/accounts' },
] as const

export const DAILY_TASKS_LOADING_TEXT = 'AI 老师正在为你制定今日任务...' as const
export const DAILY_TASKS_EMPTY_TITLE = '请先创建 IP 账号' as const
export const DAILY_TASKS_EMPTY_DESC = '完成账号配置后即可获取每日任务' as const
export const DAILY_TASKS_EMPTY_CTA = '添加账号' as const
