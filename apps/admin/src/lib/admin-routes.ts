// PRD-10 US-005 · 16 域 metadata array · sidebar + page routing 共用
// 4 组: P0 业务核心(6) · P0 内容审核(2) · P1 健康度(5) · P2 高级(4)
// PRD-11: invites prd=11 (实装 US-021)
// PRD-26 US-003: 加 domainKey 供 allowedDomains 过滤 · 权限走 6 闸 + sidebar 依据 allowedDomains 渲染

export type AdminRole = 'super_admin' | 'admin' | 'readonly_admin';

export interface AdminRouteItem {
  path: string;
  label: string;
  emoji: string;
  prd: number;
  requiredRole: AdminRole;
  summary: string;
  group: 'p0-core' | 'p0-review' | 'p1-health' | 'p2-advanced';
  domainKey: string; // maps to allowedDomains array entries
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
    domainKey: 'nsm',
  },
  {
    path: '/admin/users',
    label: '用户管理',
    emoji: '👤',
    prd: 11,
    requiredRole: 'admin',
    summary: '用户列表 · 搜索 / 状态变更 / 邀请码绑定 · 跨账号查询 + 审计',
    group: 'p0-core',
    domainKey: 'users',
  },
  {
    path: '/admin/accounts',
    label: 'IP 账号管理',
    emoji: '🏷️',
    prd: 11,
    requiredRole: 'admin',
    summary: 'IP 账号管理 · 创建者信息 / Specialist 调用统计 / 异常标记',
    group: 'p0-core',
    domainKey: 'accounts',
  },
  {
    path: '/admin/cost',
    label: '成本仪表盘',
    emoji: '💰',
    prd: 11,
    requiredRole: 'admin',
    summary: '成本仪表盘 · LLM 调用费用 / 按账号 / 按 Specialist / 账单导出',
    group: 'p0-core',
    domainKey: 'cost',
  },
  {
    path: '/admin/audit',
    label: '审计日志',
    emoji: '🔍',
    prd: 11,
    requiredRole: 'admin',
    summary: '审计日志查询 · 管理员操作记录 / trace 反查 / 取证导出',
    group: 'p0-core',
    domainKey: 'audit',
  },
  {
    path: '/admin/invites',
    label: '邀请码管理',
    emoji: '🎫',
    prd: 11,
    requiredRole: 'admin',
    summary: '邀请码管理 · campaign 分组 / 批量生成 / 使用统计',
    group: 'p0-core',
    domainKey: 'invites',
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
    domainKey: 'review_trending',
  },
  {
    path: '/admin/reviewDeepLearn',
    label: 'DeepLearn 审核',
    emoji: '📚',
    prd: 12,
    requiredRole: 'admin',
    summary: 'DeepLearningArchive 审核队列 · PII 扫描 / 用户违规累计',
    group: 'p0-review',
    domainKey: 'review_deep_learn',
  },
  // P1 健康度 5
  {
    path: '/admin/evolution-health',
    label: '进化档案监控',
    emoji: '🧬',
    prd: 13,
    requiredRole: 'readonly_admin',
    summary: '进化档案监控 · EvolutionAgent 运行状态 / 异常账号 / 强制重跑',
    group: 'p1-health',
    domainKey: 'evolution_health',
  },
  {
    path: '/admin/prompts',
    label: 'Prompt 版本管理',
    emoji: '✏️',
    prd: 13,
    requiredRole: 'super_admin',
    summary: 'Prompt 版本管理 · 14 Specialist tab / 版本时间线 / LLM Judge 灰度',
    group: 'p1-health',
    domainKey: 'prompts',
  },
  {
    path: '/admin/quota',
    label: '配额管理',
    emoji: '⚖️',
    prd: 13,
    requiredRole: 'readonly_admin',
    summary: '配额管理 · 账号 / 全局 / 调整记录 · 成本前置阀门',
    group: 'p1-health',
    domainKey: 'quota',
  },
  {
    path: '/admin/compliance',
    label: '行业合规仪表盘',
    emoji: '⚖️',
    prd: 13,
    requiredRole: 'readonly_admin',
    summary: '行业合规仪表盘 · 内容违规率 / 人工审核率 / 法务取证导出',
    group: 'p1-health',
    domainKey: 'compliance',
  },
  {
    path: '/admin/approvals',
    label: 'Approval Gates',
    emoji: '🛡️',
    prd: 13,
    requiredRole: 'admin',
    summary: 'Approval Gates 管理 · 待审批请求 / 历史决策 / 紧急通道 · super_admin 含紧急通道',
    group: 'p1-health',
    domainKey: 'approvals',
  },
  // PRD-28 Evaluation
  {
    path: '/admin/evaluation',
    label: 'Evaluation',
    emoji: '📈',
    prd: 28,
    requiredRole: 'admin',
    summary: 'LLM Judge Evaluation Runs · 评分历史 + Specialist × Mode 矩阵热力图',
    group: 'p1-health',
    domainKey: 'evaluation',
  },
  // P2 高级 4
  {
    path: '/admin/ab-experiments',
    label: 'A/B 实验',
    emoji: '🧪',
    prd: 14,
    requiredRole: 'admin',
    summary: 'A/B 实验管理 · 实验列表 / 流量分配 / 显著性检验 / 一键停损',
    group: 'p2-advanced',
    domainKey: 'ab_experiments',
  },
  {
    path: '/admin/knowledge',
    label: '常量管理',
    emoji: '📋',
    prd: 14,
    requiredRole: 'super_admin',
    summary: '常量管理 · AdminConstants / 违禁词库 / 系统级常量变更',
    group: 'p2-advanced',
    domainKey: 'knowledge',
  },
  {
    path: '/admin/constants',
    label: '知识库管理',
    emoji: '📚',
    prd: 14,
    requiredRole: 'admin',
    summary: '知识库常量管理 · 67 案例 / 23 公式 / 22 元素 版本管理 + Monaco 编辑器 + 灰度配置',
    group: 'p2-advanced',
    domainKey: 'constants',
  },
  {
    path: '/admin/feature-flags',
    label: '配置中心',
    emoji: '⚙️',
    prd: 14,
    requiredRole: 'admin',
    summary: '配置中心 · Feature flags / 紧急开关(super_admin) / 全局参数 / 后置复核',
    group: 'p2-advanced',
    domainKey: 'feature_flags',
  },
  // PRD-29.6 US-001 · LLM API Key 配置
  {
    path: '/admin/llm-config',
    label: 'LLM 配置',
    emoji: '🔑',
    prd: 29,
    requiredRole: 'super_admin',
    summary: 'LLM API Key 管理 · Anthropic + OpenAI · 加密存储 · 双审批 · super_admin only',
    group: 'p2-advanced',
    domainKey: 'llm_config',
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

/**
 * Returns true if the given route domainKey is accessible.
 * empty allowedDomains = all domains allowed (super_admin).
 */
export function isDomainAllowed(domainKey: string, allowedDomains: string[]): boolean {
  if (allowedDomains.length === 0) return true;
  return allowedDomains.includes(domainKey);
}

/** Filter ADMIN_ROUTES to those accessible under allowedDomains. */
export function getAllowedRoutes(allowedDomains: string[]): AdminRouteItem[] {
  if (allowedDomains.length === 0) return ADMIN_ROUTES;
  return ADMIN_ROUTES.filter((r) => allowedDomains.includes(r.domainKey));
}
