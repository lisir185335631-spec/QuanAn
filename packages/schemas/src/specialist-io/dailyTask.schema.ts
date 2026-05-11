/**
 * DailyTask Specialist I/O schemas — PRD-8 US-001
 * SoT §1.0.2 · canonical: DailyTaskAgent.ts (US-007)
 * 7 task types + TaskItemSchema + DailyTaskOutputSchema
 */

import { z } from 'zod';

export const TaskTypeEnum = z.enum([
  'do_step',
  'optimize_content',
  'learn_methodology',
  'review_diagnosis',
  'upload_sample',
  'set_goal',
  'engage_community',
]);

export const TaskItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(500),
  type: TaskTypeEnum,
  ctaUrl: z.string().regex(/^\//, 'ctaUrl 必须以 / 开头 · 站内跳转'),
  ctaText: z.string().min(2).max(20),
  expectedOutcome: z.string().min(10).max(200),
  estimatedMinutes: z.number().int().min(1).max(120),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  completed: z.boolean().default(false),
});

export const DailyTaskOutputSchema = z.object({
  tasks: z.array(TaskItemSchema).min(3).max(5),
});

export type TaskType = z.infer<typeof TaskTypeEnum>;
export type TaskItem = z.infer<typeof TaskItemSchema>;
export type DailyTaskOutput = z.infer<typeof DailyTaskOutputSchema>;
