// PRD-10 US-005 · 16 域 metadata array · sidebar + page routing 共用
// 4 组: P0 业务核心(6) · P0 内容审核(2) · P1 健康度(5) · P2 高级(3)
// PRD-11: invites prd=11 (实装 US-021)

export type AdminRole = 'super_admin' | 'admin' | 'readonly_admin';

export interface AdminRouteItem {
  path: string;
  label: string;
  emoji: string;
  prd: number;
  requiredRole: AdminRole;
  summary: string;
  group: 'p0-core' | 'p0-review' | 'p1-health' | 'p2-advanced';
}

export const ADMIN_ROUTES: AdminRouteItem[] = [
  // P0 业务核心 6
  {
    path: '/admin/nsm',
    label: 'NSM 仪表盘',
    emoji: '📊',
    prd: 11,
    requiredRole: 'readonly_admin',
    summary: '运营 NSM 仪表盘 · 产品健康度生死线 · 活跃 IP 账号数 + 完成率 + 反馈率',
    group: 'p0-core',
  },
  {
    path: '/admin/users',
    label: '用户管理',
    emoji: '👤',
    prd: 11,
    requiredRole: 'admin',
    summary: '用户列表 · 搜索 / 状态变更 / 邀请码绑定 · 跨账号查询 + 审计',
    group: 'p0-core',
  },
  {
    path: '/admin/accounts',
    label: 'IP 账号管理',
    emoji: '🏷️',
    prd: 11,
    requiredRole: 'admin',
    summary: 'IP 账号管理 · 创建者信息 / Specialist 调用统计 / 异常标记',
    group: 'p0-core',
  },
  {
    path: '/admin/cost',
    label: '成本仪表盘',
    emoji: '💰',
    prd: 11,
    requiredRole: 'admin',
    summary: '成本仪表盘 · LLM 调用费用 / 按账号 / 按 Specialist / 账单导出',
    group: 'p0-core',
  },
  {
    path: '/admin/audit',
    label: '审计日志',
    emoji: '🔍',
    prd: 11,
    requiredRole: 'admin',
    summary: '审计日志查询 · 管理员操作记录 / trace 反查 / 取证导出',
    group: 'p0-core',
  },
  {
    path: '/admin/invites',
    label: '邀请码管理',
    emoji: '🎫',
    prd: 11,
    requiredRole: 'admin',
    summary: '邀请码管理 · campaign 分组 / 批量生成 / 使用统计',
    group: 'p0-core',
  },
  // P0 内容审核 2
  {
    path: '/admin/reviewTrending',
    label: 'TrendingItem 审核',
    emoji: '🔥',
    prd: 12,
    requiredRole: 'admin',
    summary: 'TrendingItem 内容审核队列 · 违禁词扫描 / 批量审核 / 规则配置',
    group: 'p0-review',
  },
  {
    path: '/admin/reviewDeepLearn',
    label: 'DeepLearn 审核',
    emoji: '📚',
    prd: 12,
    requiredRole: 'admin',
    summary: 'DeepLearningArchive 审核队列 · PII 扫描 / 用户违规累计',
    group: 'p0-review',
  },
  // P1 健康度 5
  {
    path: '/admin/evolution',
    label: '进化档案监控',
    emoji: '🧬',
    prd: 13,
    requiredRole: 'admin',
    summary: '进化档案监控 · EvolutionAgent 运行状态 / 异常账号 / 强制重跑',
    group: 'p1-health',
  },
  {
    path: '/admin/prompts',
    label: 'Prompt 版本管理',
    emoji: '✏️',
    prd: 13,
    requiredRole: 'super_admin',
    summary: 'Prompt 版本管理 · 14 Specialist tab / 版本时间线 / LLM Judge 灰度',
    group: 'p1-health',
  },
  {
    path: '/admin/quota',
    label: '配额管理',
    emoji: '⚖️',
    prd: 13,
    requiredRole: 'admin',
    summary: '配额管理 · 账号 / 全局 / 调整记录 · 成本前置阀门',
    group: 'p1-health',
  },
  {
    path: '/admin/compliance',
    label: '行业合规仪表盘',
    emoji: '⚖️',
    prd: 13,
    requiredRole: 'admin',
    summary: '行业合规仪表盘 · 内容违规率 / 人工审核率 / 法务取证导出',
    group: 'p1-health',
  },
  {
    path: '/admin/approval',
    label: 'Approval Gates',
    emoji: '✅',
    prd: 13,
    requiredRole: 'super_admin',
    summary: 'Approval Gates 管理 · 待审批请求 / 历史决策 / 紧急通道',
    group: 'p1-health',
  },
  // P2 高级 3
  {
    path: '/admin/ab',
    label: 'A/B 测试',
    emoji: '🧪',
    prd: 14,
    requiredRole: 'super_admin',
    summary: 'A/B 测试管理 · Specialist 版本实验 / 流量分配 / 效果对比',
    group: 'p2-advanced',
  },
  {
    path: '/admin/knowledge',
    label: '常量管理',
    emoji: '📋',
    prd: 14,
    requiredRole: 'super_admin',
    summary: '常量管理 · AdminConstants / 违禁词库 / 系统级常量变更',
    group: 'p2-advanced',
  },
  {
    path: '/admin/config',
    label: '系统配置',
    emoji: '⚙️',
    prd: 14,
    requiredRole: 'super_admin',
    summary: '系统配置 · Feature flags / 紧急开关 / 全局参数',
    group: 'p2-advanced',
  },
];

export const ROUTE_GROUP_LABELS: Record<AdminRouteItem['group'], string> = {
  'p0-core': 'P0 业务核心',
  'p0-review': 'P0 内容审核',
  'p1-health': 'P1 健康度',
  'p2-advanced': 'P2 高级',
};

export function getRouteByPath(path: string): AdminRouteItem | undefined {
  return ADMIN_ROUTES.find((r) => r.path === path);
}
