/**
 * Vendor Adapter Framework — PRD-37 US-P11 AC-③
 *
 * 接口定义: 可插拔的第三方对标案例数据源适配器。
 * ADR-017 约束: 第三方授权 API(xinbang/cmm/official_douyin)·禁止自建爬虫(R-17)。
 *
 * 真实第三方 API (新榜/蝉妈妈) 待凭证授权 — 当前全部为 mock vendor 占位实现。
 */

// ── Vendor enum — 应用层合法值 ─────────────────────────────────────────────────
/**
 * vendor ∈ {xinbang, cmm, official_douyin}
 * 禁止 self_crawler (ADR-017 R-17 红线)
 */
export const VALID_VENDORS = ['xinbang', 'cmm', 'official_douyin'] as const;
export type Vendor = (typeof VALID_VENDORS)[number];

export function isValidVendor(v: string): v is Vendor {
  return (VALID_VENDORS as readonly string[]).includes(v);
}

/** 应用层 vendor 校验 — 抛出错误而非静默通过 */
export function assertVendor(v: string): asserts v is Vendor {
  if (!isValidVendor(v)) {
    throw new Error(
      `Invalid vendor "${v}". Must be one of: ${VALID_VENDORS.join(', ')}. ` +
        `Self-crawlers (puppeteer/playwright) are prohibited by ADR-017 R-17.`,
    );
  }
}

// ── TrendingFetchItem — adapter 返回的标准结构 ─────────────────────────────────

export interface TrendingFetchItem {
  /** 数据来源 vendor — 合法值 ∈ VALID_VENDORS */
  vendor: Vendor;
  /** 所属平台 */
  platform: string;
  /** 内容标题 */
  title: string;
  /** 内容正文(可选) */
  contentText?: string;
  /** 行业标签 */
  industry: string;
  /** 子行业(可选) */
  subIndustry?: string;
  /** 作者粉丝数 */
  authorFollowers?: number;
  /** 作者昵称 */
  authorName?: string;
  /** 点赞数 */
  likeCount: number;
  /** 评论数 */
  commentCount: number;
  /** 转发数 */
  shareCount: number;
  /** 采集时间 (ms timestamp) */
  crawledAt: number;
  /** 原始内容来源 URL (可选) */
  sourceUrl?: string;
  /** vendor 系统的唯一 ID */
  sourceItemId: string;
}

// ── FetchOptions — 查询参数 ────────────────────────────────────────────────────

export interface FetchOptions {
  /** 行业筛选 (空 = 全行业) */
  industry?: string;
  /** 子行业筛选 (空 = 全子行业) */
  subIndustry?: string;
  /** 粉丝数上限阈值 (返回 authorFollowers < maxAuthorFollowers 的内容) */
  maxAuthorFollowers?: number;
  /** 最多返回条数 */
  limit?: number;
}

// ── VendorAdapter interface ────────────────────────────────────────────────────

/**
 * 可插拔 vendor 适配器接口。
 *
 * 每个 vendor 实现此接口：
 *  - xinbang  (新榜): 待凭证 — 现为 mock 实现
 *  - cmm      (蝉妈妈): 待凭证 — 现为 mock 实现
 *  - official_douyin: 待凭证 — 现为 mock 实现
 *
 * 实装时替换各 vendor 的 fetchTrending() 为真实 HTTP 调用即可，接口不变。
 */
export interface VendorAdapter {
  readonly vendor: Vendor;
  fetchTrending(opts: FetchOptions): Promise<TrendingFetchItem[]>;
}
