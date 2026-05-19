/**
 * Unit tests — PRD-15 US-001 AC-8
 * seed.test.ts: seed industries 56 + mock_ip_accounts 5 + 幂等 re-seed + IndustryDropdown 56 项
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { INDUSTRIES } from '@/lib/constants/industries';

// ── Mock prisma helper ────────────────────────────────────────────────────────

type RecordMap<T = unknown> = Record<string, T>;

function makePrisma(store: RecordMap = {}) {
  const industryStore: RecordMap[] = (store.industries as RecordMap[]) ?? [];
  const accountStore: RecordMap[] = (store.accounts as RecordMap[]) ?? [];
  const userStore: RecordMap[] = (store.users as RecordMap[]) ?? [];

  return {
    industry: {
      findUnique: vi.fn(({ where }: { where: { key: string } }) =>
        industryStore.find((r) => r.key === where.key) ?? null,
      ),
      create: vi.fn(({ data }: { data: RecordMap }) => {
        const record = { id: industryStore.length + 1, ...data };
        industryStore.push(record);
        return record;
      }),
    },
    ipAccount: {
      findFirst: vi.fn(({ where }: { where: { userId: number; name: string } }) =>
        accountStore.find((r) => r.userId === where.userId && r.name === where.name) ?? null,
      ),
      create: vi.fn(({ data }: { data: RecordMap }) => {
        const record = { id: accountStore.length + 1, ...data };
        accountStore.push(record);
        return record;
      }),
      findMany: vi.fn(() => accountStore),
    },
    user: {
      upsert: vi.fn(({ where, create }: { where: { email: string }; create: RecordMap }) => {
        let user = userStore.find((u) => u.email === where.email);
        if (!user) {
          user = { id: userStore.length + 1, activeAccountId: null, ...create };
          userStore.push(user);
        }
        return user;
      }),
      update: vi.fn(({ where, data }: { where: { id: number }; data: RecordMap }) => {
        const user = userStore.find((u) => u.id === where.id);
        if (user) Object.assign(user, data);
        return user;
      }),
    },
    _stores: { industryStore, accountStore, userStore },
  };
}

// ── Import seed functions (dynamic to avoid top-level prisma init) ─────────────

// We inline the seed logic here to avoid importing the real prisma client.
// The seed functions are exported from prisma/seed.ts but use a module-level
// prisma instance. We test equivalent logic with mocked prisma.

const MOCK_ACCOUNTS_DATA = [
  { name: 'AI 创业者小张', industry: 'enterprise', platform: 'douyin' },
  { name: 'OPC 经营者老王', industry: 'enterprise', platform: 'douyin' },
  { name: '实体店主陈姐', industry: 'food', platform: 'douyin' },
  { name: 'MCN 矩阵号', industry: 'self_media', platform: 'douyin' },
  { name: 'Demo 演示号', industry: 'beauty', platform: 'douyin' },
] as const;

async function seedIndustriesWithPrisma(prismaClient: ReturnType<typeof makePrisma>) {
  let created = 0;
  let skipped = 0;
  for (let i = 0; i < INDUSTRIES.length; i++) {
    const ind = INDUSTRIES[i];
    const existing = await prismaClient.industry.findUnique({ where: { key: ind.key } });
    if (existing) { skipped++; continue; }
    await prismaClient.industry.create({ data: { key: ind.key, label: ind.label, category: ind.category, emoji: ind.emoji, order: i } });
    created++;
  }
  return { created, skipped };
}

async function seedMockAccountsWithPrisma(prismaClient: ReturnType<typeof makePrisma>) {
  const devUser = await prismaClient.user.upsert({
    where: { email: 'dev@quanan.local' },
    create: { openId: 'dev_mock_user', name: 'Dev User', email: 'dev@quanan.local', role: 'user', isActivated: true },
    update: {},
  });
  let created = 0;
  let skipped = 0;
  for (const acc of MOCK_ACCOUNTS_DATA) {
    const existing = await prismaClient.ipAccount.findFirst({ where: { userId: devUser.id as number, name: acc.name } });
    if (existing) { skipped++; continue; }
    await prismaClient.ipAccount.create({ data: { ...acc, userId: devUser.id, stage: 'starter', followersRange: '0-1000', ipPositioning: 'demo' } });
    created++;
  }
  return { created, skipped };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('seedIndustries', () => {
  it('creates 56 industries on first run', async () => {
    const prismaClient = makePrisma();
    const result = await seedIndustriesWithPrisma(prismaClient);
    expect(result.created).toBe(56);
    expect(result.skipped).toBe(0);
    expect(prismaClient._stores.industryStore).toHaveLength(56);
  });

  it('is idempotent: re-seed creates 0 new records', async () => {
    const prismaClient = makePrisma();
    await seedIndustriesWithPrisma(prismaClient);
    const result2 = await seedIndustriesWithPrisma(prismaClient);
    expect(result2.created).toBe(0);
    expect(result2.skipped).toBe(56);
    expect(prismaClient._stores.industryStore).toHaveLength(56);
  });
});

describe('seedMockIpAccounts', () => {
  it('creates 5 mock IP accounts on first run', async () => {
    const prismaClient = makePrisma();
    const result = await seedMockAccountsWithPrisma(prismaClient);
    expect(result.created).toBe(5);
    expect(result.skipped).toBe(0);
    expect(prismaClient._stores.accountStore).toHaveLength(5);
  });

  it('is idempotent: re-seed creates 0 new accounts', async () => {
    const prismaClient = makePrisma();
    await seedMockAccountsWithPrisma(prismaClient);
    const result2 = await seedMockAccountsWithPrisma(prismaClient);
    expect(result2.created).toBe(0);
    expect(result2.skipped).toBe(5);
    expect(prismaClient._stores.accountStore).toHaveLength(5);
  });
});

describe('INDUSTRIES constant (IndustryDropdown source)', () => {
  it('contains exactly 56 industries', () => {
    expect(INDUSTRIES).toHaveLength(56);
  });

  it('contains industries in all 5 categories with correct counts', () => {
    const byCategory: Record<string, number> = {};
    for (const ind of INDUSTRIES) {
      byCategory[ind.category] = (byCategory[ind.category] ?? 0) + 1;
    }
    expect(byCategory['生活服务']).toBe(18);
    expect(byCategory['电商零售']).toBe(13);
    expect(byCategory['内容创作']).toBe(7);
    expect(byCategory['专业服务']).toBe(14);
    expect(byCategory['产业制造']).toBe(4);
  });

  it('all industries have required key, label, emoji, and category fields', () => {
    for (const ind of INDUSTRIES) {
      expect(typeof ind.key).toBe('string');
      expect(ind.key.length).toBeGreaterThan(0);
      expect(typeof ind.label).toBe('string');
      expect(ind.label.length).toBeGreaterThan(0);
      expect(typeof ind.emoji).toBe('string');
      expect(typeof ind.category).toBe('string');
    }
  });
});
