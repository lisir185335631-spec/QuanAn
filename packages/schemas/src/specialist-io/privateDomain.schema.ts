/**
 * PrivateDomain Specialist I/O schemas — PRD-15 US-005
 * 6 阶段私域成交流程: 引流→加微→信任→朋友圈打造→成交→复购
 * AC-3: 6 配置字段 + 6 阶段 SOP 输出结构
 */

import { z } from 'zod';

// ── Input schema ───────────────────────────────────────────────────────────────

export const generatePrivateDomainInput = z.object({
  productDescription: z.string().min(1).max(1000),
  productPrice: z.number().positive(),
  targetAudience: z.string().min(1).max(500),
  ipPositioning: z.string().min(1).max(500),
  currentChannel: z.enum(['wechat', 'douyin', 'xiaohongshu', 'weibo', 'other']),
  monthlyTraffic: z.number().int().min(0),
});

export type GeneratePrivateDomainInput = z.infer<typeof generatePrivateDomainInput>;

// ── 6-stage SOP output ─────────────────────────────────────────────────────────

export const privateDomainPhaseSchema = z.object({
  key: z.enum(['attract', 'add_wechat', 'trust', 'moments', 'convert', 'repurchase']),
  name: z.string(),
  goal: z.string(),
  tactics: z.array(z.string()),
  scripts: z.array(z.string()),
  metrics: z.array(z.string()),
});

export const privateDomainSopSchema = z.object({
  phases: z.array(privateDomainPhaseSchema),
  summary: z.string(),
});

export type PrivateDomainPhase = z.infer<typeof privateDomainPhaseSchema>;
export type PrivateDomainSop = z.infer<typeof privateDomainSopSchema>;

// ── History result schema ──────────────────────────────────────────────────────

export const privateDomainResultSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  agentId: z.string(),
  traceId: z.string().nullable(),
  createdAt: z.date(),
});

export type PrivateDomainResult = z.infer<typeof privateDomainResultSchema>;
