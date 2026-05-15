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
 *   5. 67 案例 + 23 公式 + 22 元素 import 到 constant_versions (PRD-14 US-007)
 */

import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

import { KNOWLEDGE_CASES } from '../apps/api/src/lib/constants/cases';
import { COPY_FORMULAS } from '../apps/api/src/lib/constants/formulas';
import { HOT_ELEMENTS } from '../apps/api/src/lib/constants/hotElements';
import { INDUSTRIES } from '../apps/api/src/lib/constants/industries';

const prisma = new PrismaClient();

// ====================================================
// 工具
// ====================================================

function generateInviteCode(): string {
  return randomBytes(8).toString('hex').toUpperCase().slice(0, 12);
}

// ====================================================
// 0a. 行业表 (56 条) · PRD-15 US-001 AC-1
// ====================================================

export async function seedIndustries(prismaClient = prisma) {
  console.log('▸ Seeding industries (56) ...');
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < INDUSTRIES.length; i++) {
    const ind = INDUSTRIES[i];
    const existing = await prismaClient.industry.findUnique({ where: { key: ind.key } });
    if (existing) {
      skipped++;
      continue;
    }
    await prismaClient.industry.create({
      data: {
        key: ind.key,
        label: ind.label,
        category: ind.category,
        emoji: ind.emoji,
        order: i,
      },
    });
    created++;
  }

  console.log(`  ✓ industries seeded · created=${created} · skipped=${skipped}`);
  return { created, skipped };
}

// ====================================================
// 0b. Mock IP 账号 (5 个) · PRD-15 US-001 AC-2
// ====================================================

const DEV_MOCK_USER_EMAIL = 'dev@quanqn.local';

const MOCK_IP_ACCOUNTS = [
  { name: 'AI 创业者小张', industry: 'enterprise', platform: 'douyin', stage: 'starter', personalInfo: 'AI 创业者 · ip-creator 路径', ipPositioning: 'ip-creator', followersRange: '0-1000' as const },
  { name: 'OPC 经营者老王', industry: 'enterprise', platform: 'douyin', stage: 'growth', personalInfo: 'OPC 经营者 · opc-founder 路径', ipPositioning: 'opc-founder', followersRange: '1000-10000' as const },
  { name: '实体店主陈姐', industry: 'food', platform: 'douyin', stage: 'starter', personalInfo: '实体餐饮店主 · traditional-transform 路径', ipPositioning: 'traditional-transform', followersRange: '0-1000' as const },
  { name: 'MCN 矩阵号', industry: 'self_media', platform: 'douyin', stage: 'growth', personalInfo: 'MCN 矩阵账号管理 · mcn-manager 路径', ipPositioning: 'mcn-manager', followersRange: '1000-10000' as const },
  { name: 'Demo 演示号', industry: 'beauty', platform: 'douyin', stage: 'starter', personalInfo: 'Demo 演示账号', ipPositioning: 'demo', followersRange: '0-1000' as const },
] as const;

export async function seedMockIpAccounts(prismaClient = prisma) {
  console.log('▸ Seeding mock IP accounts (5) ...');

  // Ensure dev mock user exists
  const devUser = await prismaClient.user.upsert({
    where: { email: DEV_MOCK_USER_EMAIL },
    create: {
      openId: 'dev_mock_user',
      name: 'Dev User',
      email: DEV_MOCK_USER_EMAIL,
      role: 'user',
      isActivated: true,
    },
    update: {},
  });

  let created = 0;
  let skipped = 0;

  for (const acc of MOCK_IP_ACCOUNTS) {
    const existing = await prismaClient.ipAccount.findFirst({
      where: { userId: devUser.id, name: acc.name },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prismaClient.ipAccount.create({
      data: {
        userId: devUser.id,
        name: acc.name,
        industry: acc.industry,
        platform: acc.platform,
        stage: acc.stage,
        personalInfo: acc.personalInfo,
        followersRange: acc.followersRange,
        ipPositioning: acc.ipPositioning,
      },
    });
    created++;
  }

  // Set activeAccountId to first mock account if not set
  if (!devUser.activeAccountId) {
    const firstAccount = await prismaClient.ipAccount.findFirst({
      where: { userId: devUser.id },
      orderBy: { createdAt: 'asc' },
    });
    if (firstAccount) {
      await prismaClient.user.update({
        where: { id: devUser.id },
        data: { activeAccountId: firstAccount.id },
      });
    }
  }

  console.log(`  ✓ mock_ip_accounts seeded · created=${created} · skipped=${skipped}`);
  return { created, skipped, devUserId: devUser.id };
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
// 5. Prompt Versions — 14 Specialist × mode=default (PRD-13 US-003 AC-3)
// ====================================================

const SPECIALIST_SEED_CONTENT: Record<string, string> = {
  PositioningAgent: `你是「定位顾问」· IP 起号战略专家。
目标 · 基于用户行业背景和竞品分析,输出差异化 IP 定位方案,帮用户找到独特的市场切入点。
边界 · 只输出定位建议 / 不做执行计划 / 不讨论变现

定位方法论 · 目标人群 × 差异化卖点 × 平台特性 三维交叉法。
优先寻找「蓝海细分」— 竞争少 + 需求真实 + 用户付费意愿高的交叉点。`,

  BrandingAgent: `你是「人设顾问」· 个人品牌形象专家。
目标 · 为 IP 设计可持续、有辨识度的账号人设,包括名字/头像风格/简介/内容调性。
边界 · 只设计人设框架 / 不写具体文案 / 不做运营计划

人设方法论 · 真实性 × 差异性 × 一致性 铁三角。
人设必须来自真实经历,过度包装会在后续内容中露馅。
核心公式: 身份标签 + 价值主张 + 个性化记忆点`,

  MonetizationAgent: `你是「变现顾问」· IP 商业化路径专家。
目标 · 结合用户资源与粉丝画像,规划从 0 到规模化变现的清晰路径。
边界 · 只做路径规划 / 不做具体销售文案 / 不承诺 GMV 数字

变现方法论 · 流量 × 信任 × 产品 三阶段模型。
先种草建信任,再转化轻量产品,最后推高客单价。
路径选择: 直播带货 / 知识付费 / 私域 / 品牌合作 四路径按资源匹配优先级排序。`,

  TopicAgent: `你是「选题顾问」· 爆款内容选题专家。
目标 · 结合行业趋势和账号定位,输出高完播率、高互动的选题方向和内容角度。
边界 · 只输出选题 / 不写脚本文案 / 不保证播放量

选题方法论 · 热度 × 相关性 × 竞争度 三维筛选。
优先选「平台正在推的话题 × 与账号定位高度相关 × 竞品少」的交叉区间。
爆款选题公式: 情绪钩子 + 具体场景 + 意外反转`,

  CopywritingAgent: `你是文案魔法师 · 服务 · 在 [account.platform] 做 IP 的创作者
目标 · 按用户选定的 [scriptType 20 选 1] + [elements 22 选 N] 组合 · 输出可直接发的文案
边界 · ❌ 不写 AI 味开头 · ❌ 不编造数据 · ✅ 必须有 hook(5 秒钩子)

文案方法论 · 情绪共鸣 × 具体细节 × 行动指引 三要素。
脚本结构: 钩子(引发好奇) + 主体(价值输出) + 结尾(互动引导)。
标题公式: 数字 / 痛点 / 悬念 / 对比 四类黄金结构。`,

  VideoAgent: `你是「视频顾问」· 短视频拍摄制作专家。
目标 · 输出完整的分镜方案、拍摄要点和剪辑建议,让零基础创作者也能拍出专业内容。
边界 · 只给制作方案 / 不做选题 / 不写文案

视频方法论 · 黄金 3 秒开头 × 钩子 × 行动召唤 结构。
分镜设计: 开场钩子(0-3s) + 内容主体(3s-结尾前5s) + 结尾 CTA。
拍摄核心: 稳 / 亮 / 近 / 动 · 手机竖屏 9:16 优先。`,

  LivestreamAgent: `你是「直播顾问」· 直播间运营与转化专家。
目标 · 输出直播话术框架、产品讲解结构和互动留人策略,帮用户提升直播间 GMV。
边界 · 只做直播话术和策略 / 不做选品建议 / 不承诺 GMV

直播方法论 · 留人 × 转化 × 复购 三环节拆解。
开播节奏: 前5分钟留人钩子 + 中间产品讲解循环 + 结尾限时福利。
话术核心: 痛点描述 → 产品解决方案 → 社会证明 → 限时稀缺 → 行动号召。`,

  PrivateDomainAgent: `你是「私域顾问」· 私域流量运营专家。
目标 · 帮用户把公域粉丝转化为私域(微信/社群),建立长期信任关系和复购体系。
边界 · 只做私域策略 / 不做公域引流方案 / 不承诺转化率

私域方法论 · 引流 × 留存 × 转化 三段式。
引流: 钩子内容 + 评论区 + 私信模板。
留存: 社群价值内容节奏(知识/福利/互动 3:3:4)。
转化: 限时活动 + 信任背书 + 一对一成交话术。`,

  AnalysisAgent: `你是文案分析师 · 服务 · 想拆解爆款 / 优化自己文案的 IP 创业者
目标 · viral mode: 拆解爆款公式 · structural mode: 多维度评分优化建议
边界 · ❌ 不评论真实人物 · ❌ 不抄袭原文 · ✅ 引用 22 元素时用真名

方法论 · 22 元素心理学 + 67 RAG 案例对照。
viral mode: 拆解爆款 → 找"火点" → 仿写一篇(差异化 ≥ 50%)
structural mode: 6 维评分(hook/structure/emotion/specificity/cta/overall 各 0-100) → 优化建议`,

  DiagnosisAgent: `你是「诊断顾问」· IP 成长问题诊断专家。
目标 · 分析用户 IP 账号的当前状态,找出核心问题并给出优先级修复建议。
边界 · 只做诊断分析 / 不做执行计划 / 诊断基于用户提供的数据

诊断方法论 · 定位 × 内容 × 运营 三维体检。
定位维度: 账号方向清晰度 + 竞品差异化。
内容维度: 完播率 + 互动率 + 粉丝增长趋势。
运营维度: 更新频率 + 时间段选择 + 话题运用。`,

  DeepLearnAgent: `你是「深度学习顾问」· 爆款样本拆解与学习专家。
目标 · 帮用户深度分析 3-5 个标杆账号的爆款内容,提炼可复制的成功模式。
边界 · 只做样本分析 / 不做运营计划 / 分析限于用户提供的内容

深度学习方法论 · 样本 × 模式 × 迁移 三步法。
Step 1 样本拆解: 找出共性结构和差异点。
Step 2 模式提炼: 总结爆款公式(选题/钩子/结构/结尾)。
Step 3 迁移应用: 结合用户账号定位,制定个性化仿学计划。`,

  VoiceChatAgent: `你是 {account.ipPositioning} 方向的 AI 助理 · 名字叫 "{account.name} AI"。
目标 · 跟用户语音对话 · 帮他理清思路 / 查数据 / 给建议。
边界 · ❌ 不假装是真人 · ❌ 不超过 80 字单次回复 · ✅ 短句 + 口语化

多轮上下文注入 ·
1. 拉 L1 Buffer(Redis voice_chat:acc_{accountId}:turns) · 取最近 10 轮 · TTL 30min
2. 拼 # 对话历史(最近 10 轮) 到 user prompt
3. 单轮 LLM 调用 · 可能含工具 · 流式回复`,

  EvolutionAgent: `你是用户偏好分析师 · 服务 · 反馈飞轮跑批。
目标 · 把用户的所有 feedback_log + DeepLearning samples 聚合成"可注入 prompt 的偏好画像"。
边界 · ❌ 不编造金句 · ❌ 不放大单条负反馈 · ✅ insights 必须可解释

提炼规则 ·
Rule 1: preferredCatchphrases · ≥2 条 👍 反馈才入选
Rule 2: 每条 insight 必标 sourceFeedbackIds · 至少 2 个
Rule 3: 渐进更新(累积式)· 不覆盖上一版
Rule 4: preferred 跟 avoid 冲突 → 标 fallback=true`,

  DailyTaskAgent: `你是 IP 教练 · 每天给用户安排 3-5 个具体任务。
目标 · 让用户每天都有"今天该做什么"的明确清单 · 不再迷茫。
边界 · ❌ 不重复昨天任务 · ❌ 不超过 5 个任务 · ✅ 任务必带 ctaUrl

任务生成方法论 ·
优先级: 卡某 step 超 3 天 > diagnosis topPriority > 样本 < 3 > 无点评 > 新用户
每个任务必含: id + title + description + type + ctaUrl + estimatedMinutes + difficulty`,
};

async function seedPromptVersions() {
  console.log('▸ Seeding prompt versions (14 Specialist × mode=default) ...');

  // Use a system admin id=1 as placeholder (seed only · not production logic)
  const SYSTEM_ADMIN_ID = 1;

  for (const [specialistId, content] of Object.entries(SPECIALIST_SEED_CONTENT)) {
    const contentHash = createHash('sha256').update(content).digest('hex').slice(0, 64);

    // Check if a version already exists for this specialist+mode='default'
    const existing = await prisma.promptVersion.findFirst({
      where: { specialistId, mode: 'default' },
    });

    if (existing) {
      console.log(`  ⏭  ${specialistId} · mode=default · already exists (v${existing.version})`);
      continue;
    }

    await prisma.promptVersion.create({
      data: {
        specialistId,
        mode: 'default',
        version: 1,
        content,
        contentHash,
        status: 'active',
        judgeScore: null,
        createdByAdminId: SYSTEM_ADMIN_ID,
      },
    });

    console.log(`  ✅ ${specialistId} · mode=default · v1 seeded`);
  }
}

// ====================================================
// 6. Constant Versions — 67 cases + 23 formulas + 22 elements (PRD-14 US-007 AC-1)
// ====================================================

interface ConstantSeedItem {
  constantType: string;
  constantKey: string;
  content: string;
}

function buildConstantSeedItems(): ConstantSeedItem[] {
  const items: ConstantSeedItem[] = [];

  for (const c of KNOWLEDGE_CASES) {
    items.push({
      constantType: 'case',
      constantKey: c.key,
      content: `${c.title}\n${c.content}`,
    });
  }

  for (const f of COPY_FORMULAS) {
    items.push({
      constantType: 'formula',
      constantKey: f.key,
      content: `${f.title}\n${f.content}`,
    });
  }

  for (const e of HOT_ELEMENTS) {
    items.push({
      constantType: 'element',
      constantKey: e.key,
      content: `${e.label}（${e.group}）\n${e.psychology}`,
    });
  }

  return items;
}

async function seedConstantsToVersions() {
  console.log('▸ Seeding constant_versions (67 cases + 23 formulas + elements) ...');

  const SYSTEM_ADMIN_ID = 0;
  const items = buildConstantSeedItems();
  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const contentHash = createHash('sha256').update(item.content).digest('hex').slice(0, 64);

    // Check if already exists for version=1
    const existing = await prisma.constantVersion.findUnique({
      where: {
        constantType_constantKey_version: {
          constantType: item.constantType,
          constantKey: item.constantKey,
          version: 1,
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // INSERT constant_version with status='active' (seed bypass · not normal flow)
    const version = await prisma.constantVersion.create({
      data: {
        constantType: item.constantType,
        constantKey: item.constantKey,
        version: 1,
        content: item.content,
        contentHash,
        status: 'active',
        judgeScore: null,
        createdByAdminId: SYSTEM_ADMIN_ID,
      },
    });

    // Upsert constant_canary_config with currentVersionId pointing to just-created version
    const existingCanary = await prisma.constantCanaryConfig.findUnique({
      where: {
        constantType_constantKey: {
          constantType: item.constantType,
          constantKey: item.constantKey,
        },
      },
    });

    if (existingCanary) {
      skipped++;
    } else {
      await prisma.constantCanaryConfig.create({
        data: {
          constantType: item.constantType,
          constantKey: item.constantKey,
          currentVersionId: version.id,
          canaryPct: 0,
          strategy: 'user_id_hash',
          updatedByAdminId: SYSTEM_ADMIN_ID,
        },
      });
      created++;
    }
  }

  console.log(`  ✓ constant_versions seeded · created=${created} · skipped=${skipped} · total=${items.length}`);
}

// ====================================================
// 7. SystemConfig 紧急开关 (PRD-14 US-011 AC-3)
// ====================================================

async function seedSystemConfig() {
  console.log('▸ Seeding system_config (3 emergency switches) ...');

  const SYSTEM_ADMIN_ID = 1;

  const configs = [
    {
      configKey: 'stop_trending_scraper',
      configValue: false,
      description: '紧急停止 Trending Scraper 任务',
      isEmergency: true,
    },
    {
      configKey: 'stop_evolution_agent',
      configValue: false,
      description: '紧急停止 Evolution Agent 任务',
      isEmergency: true,
    },
    {
      configKey: 'enable_fallback_prompt',
      configValue: false,
      description: '启用备用 Prompt 模式(LLM 供应商故障时)',
      isEmergency: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const cfg of configs) {
    const existing = await prisma.systemConfig.findUnique({ where: { configKey: cfg.configKey } });
    if (existing) {
      console.log(`  ⏭  ${cfg.configKey} · already exists`);
      skipped++;
      continue;
    }
    await prisma.systemConfig.create({
      data: {
        configKey: cfg.configKey,
        configValue: cfg.configValue,
        description: cfg.description,
        isEmergency: cfg.isEmergency,
        updatedByAdminId: SYSTEM_ADMIN_ID,
      },
    });
    console.log(`  ✅ ${cfg.configKey} · seeded`);
    created++;
  }

  console.log(`  ✓ system_config seeded · created=${created} · skipped=${skipped}`);
}

// ====================================================
// 主入口
// ====================================================

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' QuanQn Seed v0.2');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await seedIndustries();
  await seedMockIpAccounts();
  const users = await seedUsers();
  await seedIpAccounts(users);
  await seedInviteCodes(users.admin.id);
  await seedRagConstants();
  await seedPromptVersions();
  await seedConstantsToVersions();
  await seedSystemConfig();

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
