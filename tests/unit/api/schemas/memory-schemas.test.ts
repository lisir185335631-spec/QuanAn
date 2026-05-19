/**
 * Memory schema validation tests — PRD-8 US-001 AC-12 (8 tests)
 * 3 schemas: EvolutionInsightContentSchema / DailyTaskOutputSchema / VoiceChatTurnSchema
 * happy path + rejection per schema + extra boundary tests
 */

import { describe, it, expect } from 'vitest';
import {
  EvolutionInsightContentSchema,
  TriggerTypeSchema,
  DailyTaskOutputSchema,
  VoiceChatTurnSchema,
  VOICE_CHAT_TOOLS,
} from '@quanan/schemas/specialist-io';

// ── EvolutionInsightContentSchema ─────────────────────────────────────────────

describe('EvolutionInsightContentSchema', () => {
  it('happy path: valid insight content parses', () => {
    const result = EvolutionInsightContentSchema.safeParse({
      direction: '综合',
      insights: {
        preferredCatchphrases: ['关注', '点赞'],
        styleTone: '轻松幽默',
        avoidList: ['政治敏感'],
        strongPoints: ['选题精准'],
        weakPoints: ['转化弱'],
      },
    });
    expect(result.success).toBe(true);
  });

  it('reject: unknown direction fails', () => {
    const result = EvolutionInsightContentSchema.safeParse({
      direction: 'unknown',
      insights: {
        preferredCatchphrases: [],
        styleTone: '正式',
        avoidList: [],
        strongPoints: [],
        weakPoints: [],
      },
    });
    expect(result.success).toBe(false);
  });

  it('TriggerTypeSchema: valid threshold literal parses', () => {
    expect(TriggerTypeSchema.safeParse('threshold:5').success).toBe(true);
    expect(TriggerTypeSchema.safeParse('threshold:100').success).toBe(true);
  });
});

// ── DailyTaskOutputSchema ─────────────────────────────────────────────────────

describe('DailyTaskOutputSchema', () => {
  const validTask = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: '完成内容定位步骤',
    description: '本任务帮助你完成 IP 起号第三步内容定位的核心工作。',
    type: 'do_step',
    ctaUrl: '/step/3',
    ctaText: '去完成',
    expectedOutcome: '完成内容定位模块，解锁下一步。',
    estimatedMinutes: 30,
    difficulty: 'medium',
    completed: false,
  };

  it('happy path: valid DailyTaskOutput with 3 tasks parses', () => {
    const result = DailyTaskOutputSchema.safeParse({
      tasks: [validTask, { ...validTask, type: 'optimize_content' }, { ...validTask, type: 'set_goal' }],
    });
    expect(result.success).toBe(true);
  });

  it('reject: ctaUrl not starting with / fails', () => {
    const result = DailyTaskOutputSchema.safeParse({
      tasks: [{ ...validTask, ctaUrl: 'https://example.com' }],
    });
    expect(result.success).toBe(false);
  });
});

// ── VoiceChatTurnSchema ───────────────────────────────────────────────────────

describe('VoiceChatTurnSchema', () => {
  it('happy path: valid user turn parses', () => {
    const result = VoiceChatTurnSchema.safeParse({
      turnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      role: 'user',
      content: '我想了解我的 IP 进度',
      timestamp: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it('reject: invalid role fails', () => {
    const result = VoiceChatTurnSchema.safeParse({
      turnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      role: 'system',
      content: '测试',
      timestamp: Date.now(),
    });
    expect(result.success).toBe(false);
  });
});

// ── VOICE_CHAT_TOOLS ──────────────────────────────────────────────────────────

describe('VOICE_CHAT_TOOLS', () => {
  it('has exactly 5 tools with correct names', () => {
    const names = VOICE_CHAT_TOOLS.map((t) => t.name);
    expect(names).toHaveLength(5);
    expect(names).toContain('get_current_step');
    expect(names).toContain('search_history');
    expect(names).toContain('query_diagnosis');
    expect(names).toContain('get_today_tasks');
    expect(names).toContain('get_evolution_insights');
  });
});
