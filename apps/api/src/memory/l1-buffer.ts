/**
 * L1 Buffer — PRD-8 US-001 AC-4
 * Voice chat session turns in Redis List
 * Key pattern: voice_chat:acc_{accountId}:turns
 * Max 20 turns · TTL 1800s (30 min)
 */

import { redis } from '@/lib/redis';

import type { VoiceChatTurn } from '@quanqn/schemas/specialist-io';

const KEY_PREFIX = 'voice_chat:acc_';
const KEY_SUFFIX = ':turns';
const MAX_TURNS = 20;

function bufferKey(accountId: number): string {
  return `${KEY_PREFIX}${accountId}${KEY_SUFFIX}`;
}

export async function pushTurn(accountId: number, turn: VoiceChatTurn): Promise<void> {
  const key = bufferKey(accountId);
  const serialized = JSON.stringify(turn);
  await redis.lpush(key, serialized);
  await redis.ltrim(key, 0, MAX_TURNS - 1);
  await redis.expire(key, 1800); // EXPIRE:1800s (30 min TTL · AC-5)
}

export async function getTurns(accountId: number, limit = MAX_TURNS): Promise<VoiceChatTurn[]> {
  const key = bufferKey(accountId);
  const cap = Math.min(limit, MAX_TURNS);
  const raw = await redis.lrange(key, 0, cap - 1);
  return raw.map((s) => JSON.parse(s) as VoiceChatTurn).reverse();
}

export async function clearBuffer(accountId: number): Promise<void> {
  const key = bufferKey(accountId);
  await redis.del(key);
}
