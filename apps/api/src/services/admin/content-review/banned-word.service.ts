// PRD-12 US-003 · BannedWordService — stub banned-word scanner
// SHIELD: isMock=true by default (D-077) · real call requires BANNED_WORD_ENABLE=true + webhookUrl
// AC-1: isMock = process.env.BANNED_WORD_ENABLE !== 'true'
// AC-2: isMock=true → mockDictionary 20+ words · String.includes scan
// AC-3: isMock=false + empty webhookUrl → ConfigurationError fail-fast
// AC-4: isMock=false + URL → fetch POST · fail → needs_review (conservative)

import { logger } from '@/lib/logger';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export type BannedWordVerdict = 'auto_approved' | 'auto_rejected' | 'needs_review';

export interface BannedWordScanResult {
  verdict: BannedWordVerdict;
  hits: string[];
  checkedAt: string;
}

const MOCK_DICTIONARY: string[] = [
  // 政治 ×5
  '政变',
  '颠覆政权',
  '反党',
  '境外势力',
  '推翻政府',
  // 暴力 ×5
  '恐怖袭击',
  '爆炸物',
  '枪支走私',
  '杀人教程',
  '制造炸弹',
  // 色情 ×5
  '色情内容',
  '裸聊',
  '卖淫嫖娼',
  '淫秽视频',
  '成人色情',
  // 赌博 ×5
  '网络赌博',
  '非法赌场',
  '博彩平台',
  '洗钱赌博',
  '地下钱庄',
];

export class BannedWordService {
  private readonly isMock: boolean;
  private readonly webhookUrl: string;

  constructor(
    webhookUrl: string = process.env.BANNED_WORD_API_URL ?? '',
    isMock: boolean = process.env.BANNED_WORD_ENABLE !== 'true',
  ) {
    this.isMock = isMock;
    this.webhookUrl = webhookUrl;

    // AC-3: fail-fast when real mode requested but no URL configured
    if (!this.isMock && !this.webhookUrl) {
      throw new ConfigurationError('BANNED_WORD_API_URL is required when BANNED_WORD_ENABLE=true');
    }
  }

  async scan(text: string): Promise<BannedWordScanResult> {
    const checkedAt = new Date().toISOString();

    if (this.isMock) {
      const lower = text.toLowerCase();
      const hits = MOCK_DICTIONARY.filter((w) => lower.includes(w.toLowerCase()));
      const verdict: BannedWordVerdict = hits.length > 0 ? 'auto_rejected' : 'auto_approved';
      logger.warn({ hits, mock: true }, '[banned-word-mock] scan result:');
      return { verdict, hits, checkedAt };
    }

    // AC-4: real API call · fail → needs_review (conservative)
    try {
      const resp = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = (await resp.json()) as { verdict?: BannedWordVerdict; hits?: string[] };
      return {
        verdict: json.verdict ?? 'needs_review',
        hits: json.hits ?? [],
        checkedAt,
      };
    } catch (err) {
      logger.warn({ err }, '[banned-word] API call failed, falling back to needs_review');
      return { verdict: 'needs_review', hits: [], checkedAt };
    }
  }
}

// AC-7: singleton export
export const bannedWordService = new BannedWordService();
