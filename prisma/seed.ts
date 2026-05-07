/**
 * QuanQn · Prisma seed 数据
 *
 * 跟 DATA-MODEL.md §12.2 一致
 * 跑 · pnpm db:seed
 *
 * Seed 内容 ·
 *   1. 测试用户(starter / opc / admin)
 *   2. 测试 IP 账号(每用户 1-2 个)
 *   3. 67 实战案例 + 23 公式 + 22 元素心理学 入 pgvector(★ 给 RAG 用)
 *   4. 100 邀请码(开发期)
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

// ====================================================
// 工具
// ====================================================

function generateInviteCode(): string {
  return randomBytes(8).toString('hex').toUpperCase().slice(0, 12);
}

// ====================================================
// 1. 测试用户
// ====================================================

async function seedUsers() {
  console.log('▸ Seeding users ...');

  const starter = await prisma.user.upsert({
    where: { email: 'starter@test.com' },
    create: {
      openId: 'test_starter',
      name: '测试 · 起号者',
      email: 'starter@test.com',
      role: 'user',
      isActivated: true,
      industry: 'beauty',
    },
    update: {},
  });

  const opc = await prisma.user.upsert({
    where: { email: 'opc@test.com' },
    create: {
      openId: 'test_opc',
      name: '测试 · OPC 创业者',
      email: 'opc@test.com',
      role: 'user',
      isActivated: true,
      industry: 'enterprise',
    },
    update: {},
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    create: {
      openId: 'test_admin',
      name: '测试 · 管理员',
      email: 'admin@test.com',
      role: 'admin',
      isActivated: true,
    },
    update: {},
  });

  console.log(`  ✓ Created/updated users · starter=${starter.id} · opc=${opc.id} · admin=${admin.id}`);
  return { starter, opc, admin };
}

// ====================================================
// 2. 测试 IP 账号
// ====================================================

async function seedIpAccounts(users: { starter: { id: number }; opc: { id: number } }) {
  console.log('▸ Seeding ip accounts ...');

  const acc1 = await prisma.ipAccount.create({
    data: {
      userId: users.starter.id,
      name: '美业小丽',
      industry: 'beauty',
      platform: 'douyin',
      stage: 'starter',
      personalInfo: '5 年美容师 · 最近想做个人 IP',
      followersRange: '0-1000',
      targetAudience: '25-40 岁有皮肤问题的女性',
    },
  });

  const acc2 = await prisma.ipAccount.create({
    data: {
      userId: users.opc.id,
      name: '智能体老王',
      industry: 'enterprise',
      platform: 'douyin',
      stage: 'growth',
      personalInfo: '12 年餐饮创业 · 现做 AI 智能体定制',
      followersRange: '1000-10000',
      targetAudience: '需要定制智能体降本增效的老板和 OPC 创业者',
      currentRevenue: '30-100万',
    },
  });

  // 给每账号建 EvolutionProfile
  await prisma.evolutionProfile.create({ data: { accountId: acc1.id } });
  await prisma.evolutionProfile.create({ data: { accountId: acc2.id } });

  // 同步 User.activeAccountId
  await prisma.user.update({ where: { id: users.starter.id }, data: { activeAccountId: acc1.id } });
  await prisma.user.update({ where: { id: users.opc.id }, data: { activeAccountId: acc2.id } });

  console.log(`  ✓ Created ip_accounts · acc1=${acc1.id}(美业) · acc2=${acc2.id}(智能体)`);
}

// ====================================================
// 3. 邀请码池(100 个)
// ====================================================

async function seedInviteCodes(adminId: number) {
  console.log('▸ Seeding invite codes (100) ...');

  const codes = Array.from({ length: 100 }, () => ({
    code: generateInviteCode(),
    createdById: adminId,
    campaign: 'dev_seed_2026q2',
    maxUses: 1,
  }));

  await prisma.inviteCode.createMany({ data: codes, skipDuplicates: true });
  console.log('  ✓ Created 100 invite codes (campaign=dev_seed_2026q2)');
}

// ====================================================
// 4. RAG 常量入 pgvector(★ 真要时实现 · MVP P1 只占位)
// ====================================================

// eslint-disable-next-line @typescript-eslint/require-await
async function seedRagConstants() {
  console.log('▸ Seeding RAG constants(67 cases + 23 formulas + 22 elements) ...');

  // TODO · P3 期间填充(需 LLMGateway.embed 真实实现 · P3 Phase) ·
  //   1. 读 src/lib/constants/{knowledge_cases,formulas,element_psychology}.ts
  //   2. 调 LLMGateway.embed() 生成 vector
  //   3. INSERT INTO knowledge_cases_vec / formulas_vec / elements_vec
  //
  // 详细步骤 · DATA-MODEL §12.2 + §11(seed.ts 完整版)
  //
  // 示例:
  //   const embedding = await llmGateway.embed(item.title + ' · ' + item.summary);
  //   await prisma.$executeRaw`
  //     INSERT INTO knowledge_cases_vec (item_key, content, embedding, metadata)
  //     VALUES (${item.key}, ${item.summary}, ${embedding}::vector, ${json}::jsonb)
  //     ON CONFLICT (item_key) DO UPDATE SET embedding = EXCLUDED.embedding;
  //   `;

  console.log('  ⏭ Skipped (P3 phase will implement · 需 LLMGateway.embed 真实)');
}

// ====================================================
// 主入口
// ====================================================

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' QuanQn Seed v0.1');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const users = await seedUsers();
  await seedIpAccounts(users);
  await seedInviteCodes(users.admin.id);
  await seedRagConstants();

  console.log('\n✅ Seed 完成');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
