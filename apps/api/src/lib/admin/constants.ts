// PRD-10 · admin sub-system constants
// AGENTS.md §10 · LD-A-1~5 + R-A-1~6

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  READONLY_ADMIN: 'readonly_admin',
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

export const ADMIN_ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 3,
  admin: 2,
  readonly_admin: 1,
};

export const AUDIT_EVENT_CATEGORIES = {
  AUTH: 'auth',
  DATA_QUERY: 'data_query',
  DATA_MUTATION: 'data_mutation',
  CROSS_ACCOUNT_QUERY: 'cross_account_query',
  HIGH_RISK_ACTION: 'high_risk_action',
  CONFIG_CHANGE: 'config_change',
  EXPORT: 'export',
  SECURITY_ALERT: 'security_alert',
} as const;

export type AuditEventCategory = (typeof AUDIT_EVENT_CATEGORIES)[keyof typeof AUDIT_EVENT_CATEGORIES];

export const AUDIT_EVENT_TYPES = {
  ADMIN_LOGIN: 'admin_login',
  ADMIN_LOGOUT: 'admin_logout',
  MFA_CHECK: 'mfa_check',
  CROSS_ACCOUNT_QUERY: 'cross_account_query',
  CHANGE_USER_PLAN: 'change_user_plan',
  BAN_USER: 'ban_user',
  FORCE_EVOLUTION_REBUILD: 'force_evolution_rebuild',
  INVALIDATE_INVITE_CODE: 'invalidate_invite_code',
  CHANGE_QUOTA: 'change_quota',
  PUBLISH_PROMPT: 'publish_prompt',
  ROLLBACK_PROMPT: 'rollback_prompt',
  APPROVAL_REQUEST_CREATE: 'approval_request_create',
  APPROVAL_REQUEST_RESOLVE: 'approval_request_resolve',
} as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[keyof typeof AUDIT_EVENT_TYPES];

// Session config (ADMIN §7.1)
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h
export const ADMIN_SESSION_IDLE_MS = 30 * 60 * 1000;      // 30min idle
export const ADMIN_MFA_CACHE_MS = 30 * 24 * 60 * 60 * 1000; // 30d MFA cache
