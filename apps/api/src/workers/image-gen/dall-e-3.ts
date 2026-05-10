/**
 * DALL-E 3 ImageGen Worker — PRD-6 US-009
 * ★ D-038: OpenAI image API 仅限本文件 import · 不走 LLMGateway
 * ★ R-001: API key 不暴露给前端 · 仅 worker 层使用
 * ★ REJ-008: Asset 写入必带 accountId(RLS 防护)
 * ★ REJ-009: history 反写用 prisma ORM · 不用 $executeRaw
 */

import { Decimal } from '@prisma/client/runtime/library';
// eslint-disable-next-line import/no-named-as-default
import OpenAI from 'openai';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

import type { IImageGenWorker, ImageGenJobPayload, ImageGenJobResult } from './index';

const PLACEHOLDER_URL = '/static/placeholder-1024x1024.png';
const MAX_RETRIES = 3;
const COST_USD = 0.04; // DALL-E 3 standard 1024x1024 (D-042)
const TIMEOUT_MS = 30_000; // 30s hard upper limit (AC-15)

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeCostLog(payload: ImageGenJobPayload, durationMs: number): Promise<void> {
  try {
    await prisma.costLog.create({
      data: {
        accountId: payload.accountId,
        agentId: 'ImageGenWorker',
        eventType: 'image_gen',
        callType: 'image_gen',
        modelTier: 'image',
        modelUsed: 'dall-e-3',
        provider: 'openai',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        imageCount: 1,
        costUsd: new Decimal(COST_USD.toFixed(6)),
        durationMs,
        traceId: payload.traceId,
      },
    });
  } catch (err) {
    logger.error({ err, traceId: payload.traceId }, 'image_gen.cost_log_failed');
  }
}

async function writeAsset(payload: ImageGenJobPayload, publicUrl: string): Promise<void> {
  try {
    await prisma.asset.create({
      data: {
        accountId: payload.accountId,
        assetType: 'scene_image',
        sceneIndex: payload.sceneIndex,
        publicUrl,
        generationPrompt: payload.imagePromptEn,
        generationModel: 'dall-e-3',
        relatedHistoryId: payload.historyId,
        // Required storage fields (URL-only asset from OpenAI CDN)
        fileName: `scene-${payload.sceneIndex}-${payload.traceId}.png`,
        mimeType: 'image/png',
        sizeBytes: 0,
        storageKey: `dalle3/${payload.traceId}/scene-${payload.sceneIndex}.png`,
        storageProvider: 'openai',
        traceId: payload.traceId,
      },
    });
  } catch (err) {
    logger.error({ err, traceId: payload.traceId }, 'image_gen.asset_write_failed');
  }
}

async function updateHistoryScene(
  payload: ImageGenJobPayload,
  sceneImageUrl: string,
  status: 'completed' | 'failed',
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      const history = await tx.history.findFirst({
        where: { id: payload.historyId, accountId: payload.accountId },
        select: { content: true },
      });

      if (!history) {
        logger.warn({ historyId: payload.historyId }, 'image_gen.history_not_found');
        return;
      }

      let parsed: { scenes?: Array<Record<string, unknown>>; [k: string]: unknown } = {};
      try {
        parsed = JSON.parse(history.content) as typeof parsed;
      } catch {
        logger.warn({ historyId: payload.historyId }, 'image_gen.content_not_json');
        return;
      }

      const scenes = Array.isArray(parsed.scenes) ? [...parsed.scenes] : [];
      const sceneIdx = scenes.findIndex(
        (s) => (s as { index?: number }).index === payload.sceneIndex,
      );

      if (sceneIdx !== -1) {
        scenes[sceneIdx] = { ...scenes[sceneIdx], sceneImageUrl, status };
      }

      parsed.scenes = scenes;

      await tx.history.update({
        where: { id: payload.historyId },
        data: { content: JSON.stringify(parsed) },
      });
    });
  } catch (err) {
    logger.error({ err, traceId: payload.traceId }, 'image_gen.history_update_failed');
  }
}

export class DallE3ImageGenWorker implements IImageGenWorker {
  async generate(payload: ImageGenJobPayload): Promise<ImageGenJobResult> {
    const imageGenEnabled = process.env.IMAGE_GEN_ENABLED === 'true';

    if (!imageGenEnabled) {
      return { sceneImageUrl: PLACEHOLDER_URL, costUsd: 0, durationMs: 0 };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY required for IMAGE_GEN_ENABLED=true');
    }

    const client = new OpenAI({ apiKey, timeout: TIMEOUT_MS });
    const startMs = Date.now();
    let dalleUrl: string | undefined;
    let lastError: unknown;

    // Exponential backoff: 1s / 2s / 4s (AC-6)
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          await sleep(1000 * Math.pow(2, attempt - 1));
        }

        const response = await client.images.generate({
          model: 'dall-e-3',
          prompt: payload.imagePromptEn,
          size: '1024x1024',
          style: payload.imageStyle,
          quality: 'standard',
          n: 1,
        });

        dalleUrl = response.data?.[0]?.url;
        break;
      } catch (err) {
        lastError = err;
        logger.warn({ err, attempt, traceId: payload.traceId }, 'image_gen.retry');
      }
    }

    const durationMs = Date.now() - startMs;

    if (!dalleUrl) {
      logger.error({ lastError, traceId: payload.traceId }, 'image_gen.all_retries_failed');
      await updateHistoryScene(payload, PLACEHOLDER_URL, 'failed');
      return { error: 'image_gen_failed', sceneImageUrl: PLACEHOLDER_URL };
    }

    await writeCostLog(payload, durationMs);
    await writeAsset(payload, dalleUrl);
    await updateHistoryScene(payload, dalleUrl, 'completed');

    return { sceneImageUrl: dalleUrl, costUsd: COST_USD, durationMs };
  }
}
