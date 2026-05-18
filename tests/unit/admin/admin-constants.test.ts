/**
 * admin constants/types unit tests — PRD-10 US-001
 * Verifies ADMIN_ROLES, AUDIT_EVENT_TYPES, session config constants
 */

import { describe, it, expect } from 'vitest';

import {
  ADMIN_ROLES,
  ADMIN_ROLE_HIERARCHY,
  AUDIT_EVENT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  ADMIN_SESSION_TTL_MS,
  ADMIN_SESSION_IDLE_MS,
  ADMIN_MFA_CACHE_MS,
} from '@/lib/admin/constants';

describe('ADMIN_ROLES', () => {
  it('contains super_admin, admin, readonly_admin', () => {
    expect(ADMIN_ROLES.SUPER_ADMIN).toBe('super_admin');
    expect(ADMIN_ROLES.ADMIN).toBe('admin');
    expect(ADMIN_ROLES.READONLY_ADMIN).toBe('readonly_admin');
  });

  it('role hierarchy: super_admin > admin > readonly_admin', () => {
    expect(ADMIN_ROLE_HIERARCHY['super_admin']).toBeGreaterThan(ADMIN_ROLE_HIERARCHY['admin']);
    expect(ADMIN_ROLE_HIERARCHY['admin']).toBeGreaterThan(ADMIN_ROLE_HIERARCHY['readonly_admin']);
  });
});

describe('AUDIT_EVENT_CATEGORIES', () => {
  it('contains all required event categories', () => {
    expect(AUDIT_EVENT_CATEGORIES.AUTH).toBe('auth');
    expect(AUDIT_EVENT_CATEGORIES.DATA_QUERY).toBe('data_query');
    expect(AUDIT_EVENT_CATEGORIES.HIGH_RISK_ACTION).toBe('high_risk_action');
    expect(AUDIT_EVENT_CATEGORIES.CONFIG_CHANGE).toBe('config_change');
  });
});

describe('AUDIT_EVENT_TYPES', () => {
  it('contains admin_login and admin_logout', () => {
    expect(AUDIT_EVENT_TYPES.ADMIN_LOGIN).toBe('admin_login');
    expect(AUDIT_EVENT_TYPES.ADMIN_LOGOUT).toBe('admin_logout');
  });

  it('contains high-risk action types', () => {
    expect(AUDIT_EVENT_TYPES.BAN_USER).toBe('ban_user');
    expect(AUDIT_EVENT_TYPES.CHANGE_QUOTA).toBe('change_quota');
    expect(AUDIT_EVENT_TYPES.PUBLISH_PROMPT).toBe('publish_prompt');
  });
});

describe('session config constants (ADMIN §7.1)', () => {
  it('session TTL is 12h (43200000ms)', () => {
    expect(ADMIN_SESSION_TTL_MS).toBe(12 * 60 * 60 * 1000);
  });

  it('idle timeout is 30min (1800000ms)', () => {
    expect(ADMIN_SESSION_IDLE_MS).toBe(30 * 60 * 1000);
  });

  it('MFA cache is 30 days', () => {
    expect(ADMIN_MFA_CACHE_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('TTL > idle (session lives longer than idle window)', () => {
    expect(ADMIN_SESSION_TTL_MS).toBeGreaterThan(ADMIN_SESSION_IDLE_MS);
  });
});
