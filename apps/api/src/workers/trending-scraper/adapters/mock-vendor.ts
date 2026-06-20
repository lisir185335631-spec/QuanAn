/**
 * Mock Vendor Implementations — PRD-37 US-P11 AC-③
 *
 * 【重要声明】
 * 真实第三方 API (新榜 xinbang / 蝉妈妈 cmm / official_douyin) 待凭证授权 — 当前全部为 mock vendor 占位。
 * mock vendor 不是编造数据，是结构占位机制：
 *   - 数据格式与真实 API 响应一致(字段名/类型对齐)
 *   - 返回有代表性的样本数据(行业 × 粉丝段分层)
 *   - 按 industry + authorFollowers 阈值真实过滤
 *   - 所有条目均标注 vendor 来源
 * 接入真实 API 凭证后，只需替换 fetchTrending() 内部实现，接口零改动。
 *
 * ADR-017 R-17: 禁止 self_crawler(puppeteer/playwright-core)。
 * 当前实现: mock vendor — 不发出任何外部 HTTP 请求。
 */

import type { VendorAdapter, TrendingFetchItem, FetchOptions } from './types';

// ── 内部 mock 数据池(跨 vendor 共享·按 industry+粉丝段分层) ──────────────────

interface MockSeed {
  title: string;
  contentText: string;
  platform: string;
  industry: string;
  subIndustry: string;
  authorFollowers: number; // 粉丝数(用于阈值过滤)
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

const MOCK_SEEDS: MockSeed[] = [
  // 美妆个护 · 低粉账号(粉丝 < 10w)
  {
    title: '新手必看！5分钟学会日常底妆，手残党也能学会',
    contentText: '从打底液到腮红，完整手把手教学，所有产品均为百元内平替。',
    platform: 'xiaohongshu', industry: '美妆个护', subIndustry: '底妆',
    authorFollowers: 8500, likeCount: 42000, commentCount: 3200, shareCount: 8100,
  },
  {
    title: '国产平替好用到哭！3款护肤品PK大牌，省了2000块',
    contentText: '实测国货对比大牌，成分党视角深度评测，附小红书购买链接。',
    platform: 'douyin', industry: '美妆个护', subIndustry: '护肤',
    authorFollowers: 23000, likeCount: 67000, commentCount: 5400, shareCount: 11200,
  },
  // 服饰穿搭 · 中粉账号(10w-50w)
  {
    title: '显高显瘦的秘密！这套穿搭公式让你脱胎换骨',
    contentText: '身高155的我靠这套搭配公式显高10cm，今天全部拆解给你看。',
    platform: 'douyin', industry: '服饰穿搭', subIndustry: '显高穿搭',
    authorFollowers: 125000, likeCount: 198000, commentCount: 14300, shareCount: 45000,
  },
  {
    title: '100块穿出轻奢感？我在平替中找到了答案',
    contentText: '全套预算控制在100元内，分享5个让你看起来很贵的搭配技巧。',
    platform: 'xiaohongshu', industry: '服饰穿搭', subIndustry: '平价穿搭',
    authorFollowers: 88000, likeCount: 124000, commentCount: 9800, shareCount: 32000,
  },
  // 科技数码 · 各粉丝段
  {
    title: '2026年最值得买的5款手机，真实测评不踩坑',
    contentText: '续航/拍照/散热全面测试，附各价位段推荐，小白也能看懂。',
    platform: 'bilibili', industry: '科技数码', subIndustry: '手机评测',
    authorFollowers: 340000, likeCount: 890000, commentCount: 67000, shareCount: 123000,
  },
  {
    title: '月薪5千如何配置一套学习装备？穷学生必看',
    contentText: '预算有限也能搭出高效率学习配置，二手市场+国产平替方案全解析。',
    platform: 'bilibili', industry: '科技数码', subIndustry: '装备推荐',
    authorFollowers: 45000, likeCount: 210000, commentCount: 18900, shareCount: 56000,
  },
  // 美食餐饮 · 低粉爆款
  {
    title: '这家藏在胡同里的早点铺，北京土著才知道',
    contentText: '5元一套的早餐套餐，老北京味道原汁原味，附导航地址。',
    platform: 'douyin', industry: '美食餐饮', subIndustry: '探店',
    authorFollowers: 7200, likeCount: 384000, commentCount: 28000, shareCount: 92000,
  },
  {
    title: '一个人在家的快手晚饭，15分钟搞定3个菜',
    contentText: '独居党必备！食材简单、步骤清晰，营养均衡不将就。',
    platform: 'xiaohongshu', industry: '美食餐饮', subIndustry: '家常菜',
    authorFollowers: 19000, likeCount: 76000, commentCount: 6200, shareCount: 18000,
  },
  // 健身运动
  {
    title: '在家练出腹肌！7天挑战，零器械全过程',
    contentText: '每天20分钟，7天打卡跟练计划，附完整动作讲解和注意事项。',
    platform: 'douyin', industry: '健身运动', subIndustry: '居家健身',
    authorFollowers: 560000, likeCount: 1200000, commentCount: 89000, shareCount: 245000,
  },
  {
    title: '跑步一个月，我的身体发生了什么变化？',
    contentText: '素人真实打卡记录，体重/体脂/睡眠全部数据公开，含饮食建议。',
    platform: 'bilibili', industry: '健身运动', subIndustry: '减脂记录',
    authorFollowers: 31000, likeCount: 145000, commentCount: 12800, shareCount: 38000,
  },
  // 生活方式
  {
    title: '北漂第3年，我终于想清楚了要不要继续留在北京',
    contentText: '不是逃离北上广，是真实的权衡与选择，分享我的思考框架。',
    platform: 'weibo', industry: '生活方式', subIndustry: '人生选择',
    authorFollowers: 4200, likeCount: 89000, commentCount: 14500, shareCount: 31000,
  },
  {
    title: '月薪8千，我在上海过得还挺好的（真实支出明细）',
    contentText: '房租/餐饮/娱乐/储蓄全部公开，年轻人在大城市如何生存攻略。',
    platform: 'xiaohongshu', industry: '生活方式', subIndustry: '生存指南',
    authorFollowers: 67000, likeCount: 234000, commentCount: 19200, shareCount: 73000,
  },
  // 情感社交
  {
    title: '和前男友在同一家公司上班，我选择了这样处理',
    contentText: '不狗血不回避，成年人的情感边界和职场相处之道。',
    platform: 'weibo', industry: '情感社交', subIndustry: '情感',
    authorFollowers: 2800, likeCount: 167000, commentCount: 32000, shareCount: 58000,
  },
  {
    title: '内向的人如何交朋友？我用这3个方法认识了一群好朋友',
    contentText: '内向并不是社交的障碍，分享真实有效的破冰技巧。',
    platform: 'xiaohongshu', industry: '情感社交', subIndustry: '社交技巧',
    authorFollowers: 41000, likeCount: 98000, commentCount: 8700, shareCount: 24000,
  },
  // 自媒体创作(跨行业)
  {
    title: '0粉丝起号30天：我是如何做到月入过万的？',
    contentText: '没有资源没有颜值，普通人靠内容起号的完整路径复盘。',
    platform: 'douyin', industry: '自媒体创作', subIndustry: '起号攻略',
    authorFollowers: 5500, likeCount: 512000, commentCount: 41000, shareCount: 118000,
  },
  {
    title: 'AI写文案真的有用吗？我实测了3个月，结果让我惊讶',
    contentText: '用AI辅助创作3个月的真实数据对比，哪些环节能用、哪些还得靠人工。',
    platform: 'bilibili', industry: '自媒体创作', subIndustry: 'AI工具',
    authorFollowers: 92000, likeCount: 320000, commentCount: 27000, shareCount: 82000,
  },
];

// ── 通用 mock 过滤 + 分页逻辑 ─────────────────────────────────────────────────

function applyFilters(seeds: MockSeed[], opts: FetchOptions, vendor: string): TrendingFetchItem[] {
  const limit = opts.limit ?? 20;

  let filtered = seeds.filter((s) => {
    // industry 过滤(模糊包含)
    if (opts.industry && !s.industry.includes(opts.industry) && !s.subIndustry.includes(opts.industry)) {
      return false;
    }
    // subIndustry 过滤
    if (opts.subIndustry && !s.subIndustry.includes(opts.subIndustry)) {
      return false;
    }
    // 粉丝阈值过滤: 返回 authorFollowers < maxAuthorFollowers 的内容
    if (opts.maxAuthorFollowers !== undefined && s.authorFollowers >= opts.maxAuthorFollowers) {
      return false;
    }
    return true;
  });

  // 按互动量倒序(热点在前)
  filtered = filtered.sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount));

  return filtered.slice(0, limit).map((s, i) => ({
    vendor: vendor as TrendingFetchItem['vendor'],
    platform: s.platform,
    title: s.title,
    contentText: s.contentText,
    industry: s.industry,
    subIndustry: s.subIndustry,
    authorFollowers: s.authorFollowers,
    likeCount: s.likeCount,
    commentCount: s.commentCount,
    shareCount: s.shareCount,
    crawledAt: Date.now() - i * 3600_000, // 模拟时间递减
    sourceItemId: `mock-${vendor}-${i + 1}`,
  }));
}

// ── XinbangAdapter (新榜) — 真实 API 待凭证 · 当前 mock vendor ─────────────

/**
 * 新榜 (xinbang) Adapter
 * 真实 API: https://www.newrank.cn/ — 待凭证授权后替换 fetchTrending() 内部实现。
 * 当前实现: mock vendor — 返回结构样本数据，不发出任何外部 HTTP 请求。
 */
export class XinbangAdapter implements VendorAdapter {
  readonly vendor = 'xinbang' as const;

  async fetchTrending(opts: FetchOptions): Promise<TrendingFetchItem[]> {
    // TODO: 真实 API 待凭证 — 接入新榜 OpenAPI 后在此处替换
    // 当前为 mock vendor: 返回占位数据，字段格式与真实 API 响应对齐
    return applyFilters(MOCK_SEEDS, opts, this.vendor);
  }
}

// ── CmmAdapter (蝉妈妈) — 真实 API 待凭证 · 当前 mock vendor ─────────────────

/**
 * 蝉妈妈 (cmm) Adapter
 * 真实 API: https://www.chanmama.com/ — 待凭证授权后替换 fetchTrending() 内部实现。
 * 当前实现: mock vendor — 返回结构样本数据，不发出任何外部 HTTP 请求。
 */
export class CmmAdapter implements VendorAdapter {
  readonly vendor = 'cmm' as const;

  async fetchTrending(opts: FetchOptions): Promise<TrendingFetchItem[]> {
    // TODO: 真实 API 待凭证 — 接入蝉妈妈 OpenAPI 后在此处替换
    // 当前为 mock vendor: 返回占位数据，字段格式与真实 API 响应对齐
    return applyFilters(MOCK_SEEDS, opts, this.vendor);
  }
}

// ── OfficialDouyinAdapter — 真实 API 待凭证 · 当前 mock vendor ───────────────

/**
 * 抖音官方开放平台 (official_douyin) Adapter
 * 真实 API: https://open.douyin.com/ — 待凭证授权后替换 fetchTrending() 内部实现。
 * 当前实现: mock vendor — 仅返回 platform=douyin 的条目，字段格式与真实 API 响应对齐。
 */
export class OfficialDouyinAdapter implements VendorAdapter {
  readonly vendor = 'official_douyin' as const;

  async fetchTrending(opts: FetchOptions): Promise<TrendingFetchItem[]> {
    // TODO: 真实 API 待凭证 — 接入抖音开放平台 API 后在此处替换
    // 当前为 mock vendor: 仅返回抖音平台条目
    const douyinOnly = MOCK_SEEDS.filter((s) => s.platform === 'douyin');
    return applyFilters(douyinOnly, opts, this.vendor);
  }
}

// ── Registry — 按 vendor key 获取 adapter 实例 ────────────────────────────────

const ADAPTER_REGISTRY: Record<string, VendorAdapter> = {
  xinbang: new XinbangAdapter(),
  cmm: new CmmAdapter(),
  official_douyin: new OfficialDouyinAdapter(),
};

/**
 * 获取 vendor adapter 实例。
 * vendor 不合法时抛出(应用层已由 assertVendor 前置校验)。
 */
export function getAdapter(vendor: string): VendorAdapter {
  const adapter = ADAPTER_REGISTRY[vendor];
  if (!adapter) {
    throw new Error(`No adapter registered for vendor "${vendor}". Valid: ${Object.keys(ADAPTER_REGISTRY).join(', ')}`);
  }
  return adapter;
}

/** 默认 adapter — 优先使用 xinbang(新榜) */
export const defaultAdapter: VendorAdapter = ADAPTER_REGISTRY['xinbang']!;
