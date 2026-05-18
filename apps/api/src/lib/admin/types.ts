// PRD-10 · admin sub-system TypeScript types (aligned with prisma models)

import type { AdminRole, AuditEventCategory, AuditEventType } from './constants';

export type { AdminRole, AuditEventCategory, AuditEventType };

export interface AdminUser {
  id: number;
  email: string;
  role: AdminRole;
  isMock: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface AdminSession {
  id: string;
  adminUserId: number;
  expiresAt: Date;
  isActive: boolean;
  mfaVerifiedAt: Date | null;
  createdAt: Date;
}

export interface AdminAuditLogEntry {
  id: number;
  actorAdminId: number;
  actorRole: AdminRole;
  actorMode: string | null;
  eventCategory: AuditEventCategory;
  eventType: AuditEventType;
  targetUserId: number | null;
  targetAccountId: number | null;
  targetEntity: string | null;
  targetEntityId: string | null;
  payloadHash: string;
  payload: Record<string, unknown> | null;
  approvalRequestId: number | null;
  traceId: string;
  ip: string;
  userAgent: string;
  sessionId: string;
  success: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
}
