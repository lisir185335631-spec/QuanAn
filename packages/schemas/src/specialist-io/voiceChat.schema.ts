/**
 * VoiceChat Specialist I/O schemas — PRD-8 US-001
 * SoT §1.0.3-4 · canonical: VoiceChatAgent.ts (US-011)
 * VoiceChatTurnSchema + VoiceChatBufferSchema + VOICE_CHAT_TOOLS (5 tools)
 */

import { z } from 'zod';

export const VoiceChatRoleEnum = z.enum(['user', 'assistant', 'tool']);

export const VoiceChatTurnSchema = z.object({
  turnId: z.string().uuid(),
  role: VoiceChatRoleEnum,
  content: z.string(),
  toolCalls: z
    .array(
      z.object({
        name: z.enum([
          'get_current_step',
          'search_history',
          'query_diagnosis',
          'get_today_tasks',
          'get_evolution_insights',
        ]),
        args: z.record(z.unknown()),
        result: z.string().optional(),
      }),
    )
    .optional(),
  audioUrl: z.string().url().optional(),
  timestamp: z.number().int().positive(),
});

export const VoiceChatBufferSchema = z.object({
  accountId: z.number().int().positive(),
  turns: z.array(VoiceChatTurnSchema).max(20),
  sessionId: z.string().uuid(),
  createdAt: z.number().int().positive(),
});

export const VOICE_CHAT_TOOLS = [
  {
    name: 'get_current_step' as const,
    description: '查询当前 IP 账号 9 步主线的完成进度',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'search_history' as const,
    description: '在用户的历史生成内容中搜索 · 按关键词模糊匹配',
    parameters: {
      type: 'object' as const,
      properties: {
        keyword: { type: 'string', description: '搜索关键词' },
        limit: { type: 'number', default: 5 },
      },
      required: ['keyword'] as string[],
    },
  },
  {
    name: 'query_diagnosis' as const,
    description: '查最新诊断报告(8 维度短板)',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'get_today_tasks' as const,
    description: '查今日 3-5 个推荐任务',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'get_evolution_insights' as const,
    description: '查当前 EvolutionProfile + 最新 insight',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
] as const;

export type VoiceChatRole = z.infer<typeof VoiceChatRoleEnum>;
export type VoiceChatTurn = z.infer<typeof VoiceChatTurnSchema>;
export type VoiceChatBuffer = z.infer<typeof VoiceChatBufferSchema>;
export type VoiceChatToolName = (typeof VOICE_CHAT_TOOLS)[number]['name'];
