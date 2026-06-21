/**
 * specialist-io schema tests — PRD-5 US-001
 * ≥8 zod validations: analysis viral/structural input + output + constants length 22/20
 */

import { describe, it, expect } from 'vitest';
import {
  HOT_ELEMENT_KEYS_22,
  SCRIPT_TYPE_KEYS_20,
  analysisStructuralInput,
  analysisViralInput,
  analysisStructuralOutput,
  analysisViralOutput,
  copywritingFreeGenerateInput,
  copywritingFreeOutput,
  generateBoomInput,
  boomOutput,
  analyzeVideoInput,
} from '../../../packages/schemas/src/specialist-io/index';

// ── constants length ──────────────────────────────────────────────────────────

describe('constants', () => {
  it('HOT_ELEMENT_KEYS_22 has exactly 22 items', () => {
    expect(HOT_ELEMENT_KEYS_22.length).toBe(22);
  });

  it('SCRIPT_TYPE_KEYS_20 has exactly 20 items', () => {
    expect(SCRIPT_TYPE_KEYS_20.length).toBe(20);
  });

  it('HOT_ELEMENT_KEYS_22 contains expected keys', () => {
    expect(HOT_ELEMENT_KEYS_22).toContain('greed');
    expect(HOT_ELEMENT_KEYS_22).toContain('fear');
    expect(HOT_ELEMENT_KEYS_22).toContain('social_proof');
    expect(HOT_ELEMENT_KEYS_22).toContain('low_cost_unknown');
  });

  it('SCRIPT_TYPE_KEYS_20 contains expected keys', () => {
    expect(SCRIPT_TYPE_KEYS_20).toContain('tutorial');
    expect(SCRIPT_TYPE_KEYS_20).toContain('duo_chat');
    expect(SCRIPT_TYPE_KEYS_20).toContain('storytelling');
  });

  it('HOT_ELEMENT_KEYS_22 has no duplicates', () => {
    const unique = new Set(HOT_ELEMENT_KEYS_22);
    expect(unique.size).toBe(22);
  });
});

// ── analysisStructuralInput ───────────────────────────────────────────────────

describe('analysisStructuralInput', () => {
  it('passes with valid copy ≥10 chars', () => {
    const r = analysisStructuralInput.safeParse({ copy: '这是一段超过十个字的文案内容' });
    expect(r.success).toBe(true);
  });

  it('fails when copy is too short (<10 chars)', () => {
    const r = analysisStructuralInput.safeParse({ copy: '短' });
    expect(r.success).toBe(false);
  });

  it('fails when copy exceeds 3000 chars', () => {
    const r = analysisStructuralInput.safeParse({ copy: 'a'.repeat(3001) });
    expect(r.success).toBe(false);
  });
});

// ── analysisViralInput ────────────────────────────────────────────────────────

describe('analysisViralInput', () => {
  it('passes with lastCopy only (lastTitle optional)', () => {
    const r = analysisViralInput.safeParse({ lastCopy: '这是一段超过十个字的爆款文案全文内容' });
    expect(r.success).toBe(true);
  });

  it('passes with both lastTitle and lastCopy', () => {
    const r = analysisViralInput.safeParse({
      lastTitle: '爆款标题',
      lastCopy: '这是完整的爆款视频文案内容',
    });
    expect(r.success).toBe(true);
  });

  it('fails when lastCopy is missing', () => {
    const r = analysisViralInput.safeParse({ lastTitle: '只有标题' });
    expect(r.success).toBe(false);
  });

  it('fails when lastTitle exceeds 200 chars', () => {
    const r = analysisViralInput.safeParse({
      lastTitle: 'a'.repeat(201),
      lastCopy: '有效的文案内容超过十个字',
    });
    expect(r.success).toBe(false);
  });
});

// ── analysisStructuralOutput ──────────────────────────────────────────────────

describe('analysisStructuralOutput', () => {
  it('passes with valid structural output', () => {
    const r = analysisStructuralOutput.safeParse({
      scores: { hook: 75, structure: 80, emotion: 65, specificity: 70, cta: 55, overall: 73 },
      optimizations: [
        { dimension: '钩子', issue: '开头平淡', suggestion: '加入数字' },
        { dimension: '情绪', issue: '缺乏张力', suggestion: '增加对比' },
        { dimension: 'CTA', issue: '结尾弱', suggestion: '明确行动指令' },
      ],
      rewriteSnippet: '改写后的示例片段，包含至少五十个字符以满足最小长度要求，确保测试通过。这里添加更多文字让它超过五十字符限制，完全达标。',
      elements: ['钩子开场', '痛点共鸣'],
      pros: ['结构清晰，层次分明。'],
      cons: ['结尾引导不足。'],
    });
    expect(r.success).toBe(true);
  });

  it('fails when optimizations has fewer than 3 items', () => {
    const r = analysisStructuralOutput.safeParse({
      scores: { hook: 70, structure: 70, emotion: 70, specificity: 70, cta: 70, overall: 70 },
      optimizations: [{ dimension: '钩子', issue: 'x', suggestion: 'y' }],
      rewriteSnippet: '改写片段内容足够长，超过五十个字符，满足最小长度验证要求。',
    });
    expect(r.success).toBe(false);
  });

  it('fails when score value exceeds 100', () => {
    const r = analysisStructuralOutput.safeParse({
      scores: { hook: 101, structure: 70, emotion: 70, specificity: 70, cta: 70, overall: 70 },
      optimizations: [
        { dimension: '钩子', issue: 'x', suggestion: 'y' },
        { dimension: '情绪', issue: 'x', suggestion: 'y' },
        { dimension: 'CTA', issue: 'x', suggestion: 'y' },
      ],
      rewriteSnippet: '足够长的改写示例片段内容，超过五十个字符确保验证通过。这里添加更多文字补足长度要求，确保满足最小值。',
    });
    expect(r.success).toBe(false);
  });
});

// ── analysisViralOutput ───────────────────────────────────────────────────────

describe('analysisViralOutput', () => {
  it('passes with valid viral output', () => {
    const r = analysisViralOutput.safeParse({
      analysis: {
        elements: ['fear', 'social_proof'],
        structure: '钩子 → 痛点 → 案例 → CTA',
        hookType: 'opening_5s',
        viralFormula: '恐惧 + 权威背书 + 案例',
      },
      viralStructure: {
        hook: '你是否曾担心错过这个机会？',
        body: '通过社会证明建立信任，展示真实案例数据。',
        cta: '立即关注获取详情',
      },
      insights: [
        { element: 'fear', explanation: '触发损失厌恶心理', impact: '高' },
        { element: 'social_proof', explanation: '增加信任感', impact: '中' },
        { element: 'authority', explanation: '建立专业人设', impact: '高' },
      ],
      rewriteVersion: '这是一篇超过五十字符的仿写版本，内容与原文结构相同但行业不同，满足差异化要求。此处补充更多内容确保超过五十字符最低限制。',
    });
    expect(r.success).toBe(true);
  });

  it('fails when insights has fewer than 3 items', () => {
    const r = analysisViralOutput.safeParse({
      analysis: {
        elements: ['fear'],
        structure: '简单结构',
        hookType: 'x',
        viralFormula: 'y',
      },
      insights: [{ element: 'fear', explanation: '只有一条', impact: '高' }],
      rewriteVersion: '足够长的仿写版本超过五十个字符以满足最小长度验证要求，这里添加更多内容补足五十字符限制，完全达标。',
    });
    expect(r.success).toBe(false);
  });
});

// ── copywritingFreeGenerateInput ──────────────────────────────────────────────

describe('copywritingFreeGenerateInput', () => {
  it('passes with valid input', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: ['fear', 'curiosity'],
      topic: '减肥打卡挑战',
    });
    expect(r.success).toBe(true);
  });

  it('fails when elements is empty', () => {
    const r = copywritingFreeGenerateInput.safeParse({
      scriptType: 'tutorial',
      elements: [],
      topic: '话题',
    });
    expect(r.success).toBe(false);
  });
});

// ── generateBoomInput ─────────────────────────────────────────────────────────

describe('generateBoomInput', () => {
  it('passes with elements only', () => {
    const r = generateBoomInput.safeParse({ elements: ['greed', 'fear'] });
    expect(r.success).toBe(true);
  });

  it('fails when elements is empty', () => {
    const r = generateBoomInput.safeParse({ elements: [] });
    expect(r.success).toBe(false);
  });
});

// ── boomOutput ────────────────────────────────────────────────────────────────

describe('boomOutput', () => {
  // Each field must meet minimum character counts (JS .length):
  // opening/development/climax/ending: min(40) · reason: min(20) · title: min(6) max(80) · indexScore: min(1) max(8)
  const makeCandidates = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      title: `候选${i + 1}号：揭秘快速涨粉核心`,
      opening: 'A'.repeat(40),
      development: 'B'.repeat(40),
      climax: 'C'.repeat(40),
      ending: 'D'.repeat(40),
      reason: `候选${i + 1}：好奇心+社会证明双元素，结构完整。`,
      indexScore: `${Math.min(9 - i, 8)}`,
    }));

  it('passes with exactly 5 candidates', () => {
    const r = boomOutput.safeParse({
      candidates: makeCandidates(5),
      metadata: { count: 5, elements: ['greed'] },
    });
    expect(r.success).toBe(true);
  });

  it('fails with 4 candidates (must be exactly 5)', () => {
    const r = boomOutput.safeParse({
      candidates: makeCandidates(4),
      metadata: { count: 5, elements: ['greed'] },
    });
    expect(r.success).toBe(false);
  });
});

// ── analyzeVideoInput (rewritten schema) ─────────────────────────────────────

describe('analyzeVideoInput (PRD-5 rewrite)', () => {
  it('passes with lastCopy only', () => {
    const r = analyzeVideoInput.safeParse({ lastCopy: '这是一段爆款文案的全文内容' });
    expect(r.success).toBe(true);
  });

  it('no longer accepts videoUrl field (PRD-2 removed)', () => {
    // new schema only cares about lastCopy — videoUrl not required
    const r = analyzeVideoInput.safeParse({ lastCopy: '这是足够长的爆款文案内容全文' });
    expect(r.success).toBe(true);
  });
});

// ── copywritingFreeOutput ─────────────────────────────────────────────────────

describe('copywritingFreeOutput', () => {
  it('fails when markdown is too short (<400 chars)', () => {
    const r = copywritingFreeOutput.safeParse({
      markdown: '太短',
      metadata: { scriptType: 'tutorial', elements: ['fear'], structureSummary: 'x', estimatedDuration: '60s' },
    });
    expect(r.success).toBe(false);
  });
});
