// PRD-11 US-008 · users CSV export unit tests
// Tests: CSV escape, row formatting, chunk iteration, row-count gate

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockUserCount = vi.hoisted(() => vi.fn());
const mockUserFindMany = vi.hoisted(() => vi.fn());

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: mockUserCount,
      findMany: mockUserFindMany,
    },
  },
}));

// luciaAdmin mock — readSessionCookie returns the cookie value
const mockValidateAdminSession = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/lucia-admin', () => ({
  luciaAdmin: {
    readSessionCookie: (cookieHeader: string) => {
      const m = cookieHeader.match(/admin_session_id=([^;]+)/);
      return m ? m[1] : null;
    },
  },
  validateAdminSession: mockValidateAdminSession,
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import {
  escapeCsvField,
  formatUserCsvRow,
  handleExportUsersCSV,
  CSV_MAX_EXPORT_ROWS,
} from '@/trpc/routers/admin/users';

// ── Fixtures ───────────────────────────────────────────────────────────────

const ADMIN_USER = { id: 1, role: 'super_admin', email: 'admin@test.com' };
const ADMIN_SESSION = { id: 'sess-001' };

const VALID_COOKIE = 'admin_session_id=sess-001';

function makeRequest(path = '/admin/export/users', cookie = VALID_COOKIE): Request {
  return new Request(`http://localhost:3000${path}`, {
    headers: { cookie },
  });
}

function makeUserRow(overrides: Partial<{
  id: number;
  email: string;
  plan: string;
  industry: string | null;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  isBanned: boolean;
}> = {}) {
  return {
    id: 1,
    email: 'user@example.com',
    plan: 'free',
    industry: null,
    role: 'user',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    lastLoginAt: null,
    isBanned: false,
    ...overrides,
  };
}

// ── escapeCsvField ─────────────────────────────────────────────────────────

describe('escapeCsvField', () => {
  it('returns empty string for null/undefined', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  it('returns plain string unchanged when no special chars', () => {
    expect(escapeCsvField('hello')).toBe('hello');
    expect(escapeCsvField(42)).toBe('42');
    expect(escapeCsvField(true)).toBe('true');
  });

  it('wraps in quotes when field contains comma', () => {
    expect(escapeCsvField('value, with comma')).toBe('"value, with comma"');
  });

  it('escapes double quotes and wraps', () => {
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""');
  });

  it('wraps in quotes when field contains newline', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('wraps in quotes when field contains carriage return', () => {
    expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('formats Date as ISO string', () => {
    const d = new Date('2024-06-15T10:30:00.000Z');
    expect(escapeCsvField(d)).toBe('2024-06-15T10:30:00.000Z');
  });
});

// ── formatUserCsvRow ───────────────────────────────────────────────────────

describe('formatUserCsvRow', () => {
  it('formats a basic row with no special chars', () => {
    const row = makeUserRow();
    const result = formatUserCsvRow(row);
    expect(result).toBe('1,user@example.com,free,,user,2024-01-01T00:00:00.000Z,,0');
  });

  it('outputs 1 for banned user', () => {
    const row = makeUserRow({ isBanned: true });
    expect(formatUserCsvRow(row)).toContain(',1');
  });

  it('escapes email with special chars', () => {
    const row = makeUserRow({ email: 'user+"quote"@example.com' });
    const result = formatUserCsvRow(row);
    expect(result).toContain('"user+""quote""@example.com"');
  });

  it('includes lastLoginAt ISO string when set', () => {
    const loginAt = new Date('2024-03-10T08:00:00.000Z');
    const row = makeUserRow({ lastLoginAt: loginAt });
    const result = formatUserCsvRow(row);
    expect(result).toContain('2024-03-10T08:00:00.000Z');
  });

  it('includes industry field', () => {
    const row = makeUserRow({ industry: 'tech,media' });
    const result = formatUserCsvRow(row);
    expect(result).toContain('"tech,media"');
  });
});

// ── handleExportUsersCSV ───────────────────────────────────────────────────

describe('handleExportUsersCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateAdminSession.mockResolvedValue({ session: ADMIN_SESSION, user: ADMIN_USER });
    mockUserCount.mockResolvedValue(0);
    mockUserFindMany.mockResolvedValue([]);
  });

  it('returns 401 when no session cookie', async () => {
    const req = makeRequest('/admin/export/users', '');
    const res = await handleExportUsersCSV(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when session invalid', async () => {
    mockValidateAdminSession.mockResolvedValue({ session: null, user: null });
    const res = await handleExportUsersCSV(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 400 with error message when row count > 500k', async () => {
    mockUserCount.mockResolvedValue(CSV_MAX_EXPORT_ROWS + 1);
    const res = await handleExportUsersCSV(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('please narrow filters');
  });

  it('returns 200 with CSV content-type for empty result', async () => {
    mockUserCount.mockResolvedValue(0);
    mockUserFindMany.mockResolvedValue([]);
    const res = await handleExportUsersCSV(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const body = await res.text();
    expect(body).toContain('id,email,plan,industry,role,createdAt,lastLoginAt,banned');
  });

  it('streams all rows in a single chunk when count <= 1000', async () => {
    const rows = [makeUserRow({ id: 1 }), makeUserRow({ id: 2, email: 'b@test.com' })];
    mockUserCount.mockResolvedValue(2);
    mockUserFindMany.mockResolvedValue(rows);

    const res = await handleExportUsersCSV(makeRequest());
    const body = await res.text();
    expect(body).toContain('user@example.com');
    expect(body).toContain('b@test.com');
  });

  it('iterates multiple chunks when findMany returns exactly 1000 rows', async () => {
    // First call returns 1000 rows, second returns 0
    const chunk = Array.from({ length: 1000 }, (_, i) => makeUserRow({ id: i + 1, email: `u${i}@t.com` }));
    mockUserCount.mockResolvedValue(1000);
    mockUserFindMany
      .mockResolvedValueOnce(chunk)
      .mockResolvedValueOnce([]);

    const res = await handleExportUsersCSV(makeRequest());
    const body = await res.text();
    // Should have called findMany twice: once for chunk, once for empty terminator
    expect(mockUserFindMany).toHaveBeenCalledTimes(2);
    expect(body).toContain('u0@t.com');
  });

  it('writes audit log on successful export', async () => {
    mockUserCount.mockResolvedValue(5);
    mockUserFindMany.mockResolvedValue([]);

    const res = await handleExportUsersCSV(makeRequest());
    await res.text(); // consume stream
    // Give void promise a tick
    await new Promise((r) => setTimeout(r, 10));
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'export',
        eventType: 'export_users_csv',
        actorAdminId: ADMIN_USER.id,
      }),
    );
  });

  it('Content-Disposition header contains correct filename pattern', async () => {
    mockUserCount.mockResolvedValue(0);
    mockUserFindMany.mockResolvedValue([]);
    const res = await handleExportUsersCSV(makeRequest());
    const cd = res.headers.get('content-disposition') ?? '';
    expect(cd).toMatch(/users-export-.*\.csv/);
  });

  it('allows readonly_admin role to export (AC-10)', async () => {
    mockValidateAdminSession.mockResolvedValue({
      session: ADMIN_SESSION,
      user: { ...ADMIN_USER, role: 'readonly_admin' },
    });
    mockUserCount.mockResolvedValue(0);
    mockUserFindMany.mockResolvedValue([]);
    const res = await handleExportUsersCSV(makeRequest());
    expect(res.status).toBe(200);
  });

  it('accepts exactly 500k rows without error (AC-7 edge)', async () => {
    mockUserCount.mockResolvedValue(CSV_MAX_EXPORT_ROWS);
    mockUserFindMany.mockResolvedValue([]);
    const res = await handleExportUsersCSV(makeRequest());
    expect(res.status).toBe(200);
  });

  it('passes filter params to DB query', async () => {
    mockUserCount.mockResolvedValue(0);
    mockUserFindMany.mockResolvedValue([]);
    const req = new Request(
      'http://localhost:3000/admin/export/users?search=foo&role=admin&plan=pro&industry=tech',
      { headers: { cookie: VALID_COOKIE } },
    );
    await handleExportUsersCSV(req);
    expect(mockUserCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: 'admin', plan: 'pro', industry: 'tech' }),
      }),
    );
  });
});
