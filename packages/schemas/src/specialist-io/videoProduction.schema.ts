/**
 * VideoProduction Specialist I/O schemas — PRD-2 US-004
 */

import { z } from 'zod';

export const generateVideoInput = z.object({
  stepKey: z.string().min(1).max(64),
  style: z.string().max(64).optional(),
  duration: z.number().int().min(1).max(600).optional(),
  context: z.record(z.unknown()).optional(),
});

export const generateStoryboardInput = z.object({
  stepKey: z.string().min(1).max(64),
  sceneCount: z.number().int().min(1).max(30).default(5),
  style: z.string().max(64).optional(),
});

export const generateSceneImageInput = z.object({
  storyboardHistoryId: z.number().int().positive(),
  sceneIndex: z.number().int().min(0),
  prompt: z.string().min(1).max(500).optional(),
});

export const videoProductionResultSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  agentId: z.string(),
  traceId: z.string().nullable(),
  createdAt: z.date(),
});

export type GenerateVideoInput = z.infer<typeof generateVideoInput>;
export type GenerateStoryboardInput = z.infer<typeof generateStoryboardInput>;
export type GenerateSceneImageInput = z.infer<typeof generateSceneImageInput>;
export type VideoProductionResult = z.infer<typeof videoProductionResultSchema>;
