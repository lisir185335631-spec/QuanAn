// PRD-11 US-005 · auth-lastlogin unit tests
// 4 tests: login success update / failure no-throw / IPv4 write / IPv6 write

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// vi.hoisted() — must come before vi.mock factories (factory hoisting rule)
// ---------------------------------------------------------------------------

const { mockUpdate, mockWarn } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockWarn: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { update: mockUpdate },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: mockWarn },
}));

// Import after mocks are registered
import { updateLastLogin } from '../auth';

const fakePrisma = { user: { update: mockUpdate } } as never;

describe('updateLastLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('login success — calls prisma.user.update with lastLoginAt and lastLoginIp', async () => {
    await updateLastLogin(fakePrisma, 42, '192.168.1.1');

    expect(mockUpdate).toHaveBeenCalledOnce();
    const call = mockUpdate.mock.calls[0]![0] as {
      where: { id: number };
      data: { lastLoginAt: Date; lastLoginIp: string | null };
    };
    expect(call.where.id).toBe(42);
    expect(call.data.lastLoginAt).toBeInstanceOf(Date);
    expect(call.data.lastLoginIp).toBe('192.168.1.1');
  });

  it('login failure (DB error) — does not throw, logs warning', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB connection failed'));

    await expect(updateLastLogin(fakePrisma, 1, '127.0.0.1')).resolves.toBeUndefined();
    expect(mockWarn).toHaveBeenCalledOnce();
  });

  it('IPv4 address — stored correctly', async () => {
    const ipv4 = '203.0.113.42';
    await updateLastLogin(fakePrisma, 7, ipv4);

    const call = mockUpdate.mock.calls[0]![0] as { data: { lastLoginIp: string } };
    expect(call.data.lastLoginIp).toBe(ipv4);
    expect(call.data.lastLoginIp.length).toBeLessThanOrEqual(45);
  });

  it('IPv6 address (39 chars) — stored correctly, length ≤ 45', async () => {
    const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    expect(ipv6.length).toBe(39);

    await updateLastLogin(fakePrisma, 9, ipv6);

    const call = mockUpdate.mock.calls[0]![0] as { data: { lastLoginIp: string } };
    expect(call.data.lastLoginIp).toBe(ipv6);
    expect(call.data.lastLoginIp.length).toBeLessThanOrEqual(45);
  });
});
