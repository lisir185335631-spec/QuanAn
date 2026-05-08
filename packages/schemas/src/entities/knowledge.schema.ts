// @quanqn/schemas/entities/knowledge — PRD-2 US-006

import { z } from 'zod';

export const knowledgeFavoriteSchema = z.object({
  id: z.number().int().positive(),
  accountId: z.number().int().positive(),
  itemType: z.string().max(32),
  itemKey: z.string().max(128),
  userTags: z.array(z.string()),
  noteId: z.number().int().positive().nullable(),
  createdAt: z.date(),
});

export const addFavoriteInput = z.object({
  itemType: z.string().min(1).max(32),
  itemKey: z.string().min(1).max(128),
  userTags: z.array(z.string().max(64)).optional(),
});

export const removeFavoriteInput = z.object({
  itemType: z.string().min(1).max(32),
  itemKey: z.string().min(1).max(128),
});

export const knowledgeNoteSchema = z.object({
  id: z.number().int().positive(),
  accountId: z.number().int().positive(),
  itemType: z.string().max(32).nullable(),
  itemKey: z.string().max(128).nullable(),
  content: z.string(),
  title: z.string().max(200).nullable(),
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const addNoteInput = z.object({
  content: z.string().min(1),
  title: z.string().max(200).optional(),
  itemType: z.string().max(32).optional(),
  itemKey: z.string().max(128).optional(),
  tags: z.array(z.string().max(64)).optional(),
});

export type KnowledgeFavoriteFields = z.infer<typeof knowledgeFavoriteSchema>;
export type AddFavoriteInput = z.infer<typeof addFavoriteInput>;
export type KnowledgeNoteFields = z.infer<typeof knowledgeNoteSchema>;
export type AddNoteInput = z.infer<typeof addNoteInput>;
