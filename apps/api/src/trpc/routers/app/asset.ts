/**
 * asset router — PRD-37 US-P08
 * uploadAsset: 接收 base64 文件 → 创建 Asset 记录(relatedStepKey='step1'·assetType='user_upload')
 *              → 触发 file-parser job(fileBuffer base64 + assetId) → parsedText 由 worker 写入
 *
 * summarizeStep1Assets: 读 step1 上传的 Asset.parsedText → LLM 梳理产 productSummary/personaSummary
 *                       → 写回 StepData(step1).result
 *
 * S3 status: mock/local only — 真 S3 上传待凭证(storageKey = mock-s3 路径)
 * LLM KEY status: 调用现有 positioningAgent llmGateway — 需要 ANTHROPIC_API_KEY 在运行时就绪
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { fileParserQueue } from '@/workers/file-parser/queue';
import { logger } from '@/lib/logger';
import { maskString } from '@/lib/compliance/pii-mask';
import { checkAssetUploadRateLimit } from '@/lib/rate-limit/asset-upload';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';
import type { ILLMGateway } from '@/specialists/base/types';
import type { Prisma } from '@prisma/client';

// ── MIME 白名单 (对齐 worker.ts:32-43) ──────────────────────────────────────────
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'text/markdown': '.md',
  'text/x-markdown': '.md',
  'text/plain': '.txt',
};

const ACCEPT_LABEL = 'PDF / Word (.docx) / Excel (.xlsx) / Markdown (.md)';
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// ── uploadAsset input ─────────────────────────────────────────────────────────

const uploadAssetInput = z.object({
  /**
   * Base64-encoded file content (DataURL 或 纯 base64)。
   * 纯 base64: 直接用; DataURL (data:<mime>;base64,<data>): 自动剥头。
   * .max(28_000_000): 兜底防超大 base64 字符串绕过 body limit (R-14 P1)
   */
  fileDataUrl: z.string().min(1).max(28_000_000),
  fileName: z.string().min(1).max(255),
  /**
   * SECURITY DEBT (P2 · MIME 客户端可伪造): fileMime 来自前端，无 magic number 验证。
   * 当前仅做白名单枚举检查(ALLOWED_MIME_TYPES)。
   * 真实 MIME 校验需在 file-parser worker 侧做 magic number 检测 (track as tech-debt)。
   */
  fileMime: z.string().min(1).max(100),
  fileSizeBytes: z.number().int().min(1),
  /**
   * 关联的 step key — P08 固定传 'step1'。
   * relatedStepKey 约束 ≤ 16 chars (schema.prisma:336 db.VarChar(16))。
   */
  relatedStepKey: z.string().max(16).default('step1'),
  /**
   * 语义分类: 'product_material' | 'persona_file'
   * 存 assetType = 'user_upload'，但前端用 assetSubtype 区分两个 dropzone。
   * 这里存在 storageKey 路径里以便审计，不单独建字段。
   */
  assetSubtype: z.enum(['product_material', 'persona_file']).default('product_material'),
});

// ── summarizeStep1Assets input ────────────────────────────────────────────────

const summarizeStep1AssetsInput = z.object({
  productMaterialAssetIds: z.array(z.number()).optional().default([]),
  personaFileAssetIds: z.array(z.number()).optional().default([]),
});

// ── LLM summary prompt builders ───────────────────────────────────────────────

function buildProductSummaryPrompt(texts: string[]): string {
  // PII 脱敏: parsedText 来自用户上传文件，可能含手机/邮箱/身份证等 PII (R-14 · LD-018 · P1)
  // GDPR 注 (GDPR-DEBT): parsedText 在 Asset 表中保留原文(审核队列需要)；仅在进 LLM 前脱敏。
  const combined = maskString(texts.join('\n\n---\n\n')).text.slice(0, 8000);
  return [
    '[产品资料梳理任务 · PRD-37 US-P08]',
    '',
    '以下是用户上传的产品资料原文（已提取）：',
    '',
    combined,
    '',
    '请以 JSON 格式返回产品摘要，格式如下：',
    '{',
    '  "productSummary": "产品核心卖点、功能特点、目标客群、价格定位等要素的结构化摘要（中文，200-500字）"',
    '}',
    '',
    '⚠️ 要求：',
    '- productSummary 必须 ≥ 200 字，≤ 500 字',
    '- 聚焦产品核心价值主张，不要照抄原文',
    '- 以 JSON 返回，不要输出其他内容',
  ].join('\n');
}

function buildPersonaSummaryPrompt(texts: string[]): string {
  // PII 脱敏: parsedText 来自用户上传文件，可能含手机/邮箱/身份证等 PII (R-14 · LD-018 · P1)
  // GDPR 注 (GDPR-DEBT): parsedText 在 Asset 表中保留原文(审核队列需要)；仅在进 LLM 前脱敏。
  const combined = maskString(texts.join('\n\n---\n\n')).text.slice(0, 8000);
  return [
    '[人物介绍梳理任务 · PRD-37 US-P08]',
    '',
    '以下是用户上传的人物介绍原文（已提取）：',
    '',
    combined,
    '',
    '请以 JSON 格式返回人物摘要，格式如下：',
    '{',
    '  "personaSummary": "人物从业经历、专业背景、核心优势、个人故事等要素的结构化摘要（中文，200-500字）"',
    '}',
    '',
    '⚠️ 要求：',
    '- personaSummary 必须 ≥ 200 字，≤ 500 字',
    '- 聚焦人物 IP 价值主张，不要照抄原文',
    '- 以 JSON 返回，不要输出其他内容',
  ].join('\n');
}

// ── Router ───────────────────────────────────────────────────────────────────

export const assetRouter = router({
  /**
   * uploadAsset — PRD-37 US-P08
   * 1. 校验 MIME + 大小
   * 2. 创建 Asset 记录(parsingStatus='pending')
   * 3. 触发 file-parser BullMQ job(fileBuffer base64 + assetId)
   * 4. 返回 assetId — 前端存到 step1 inputs
   *
   * S3 status: mock/local only — storageKey = mock-s3 路径; 真 S3 待凭证
   */
  uploadAsset: protectedProcedure
    .input(uploadAssetInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, user, traceId } = ctx;

      // ── 0. Rate limit ─────────────────────────────────────────────────────────
      // 防高频上传堆 BullMQ job (P2 · R-14)
      await checkAssetUploadRateLimit(activeAccountId!);

      // ── 1. MIME 校验 ──────────────────────────────────────────────────────────
      if (!ALLOWED_MIME_TYPES[input.fileMime]) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `仅支持 ${ACCEPT_LABEL}。收到: ${input.fileMime}`,
        });
      }

      // ── 2. 剥 DataURL 头，取纯 base64 ─────────────────────────────────────────
      let pureBase64 = input.fileDataUrl;
      if (pureBase64.includes(',')) {
        pureBase64 = pureBase64.split(',')[1] ?? pureBase64;
      }

      // ── 3. 实际大小校验(不信前端 fileSizeBytes · P1 · R-14) ───────────────────
      // base64 解码字节数 ≈ base64Length * 0.75 (去除 padding 后精确估算)
      // 使用 Math.ceil 保守估算(不会低估)；超过 20MB 拒绝。
      const actualSizeBytes = Math.ceil((pureBase64.length * 3) / 4);
      if (actualSizeBytes > MAX_SIZE_BYTES) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `文件不能超过 20MB。实际大小约: ${(actualSizeBytes / 1024 / 1024).toFixed(1)}MB`,
        });
      }

      // ── 4. 创建 Asset 记录 ────────────────────────────────────────────────────
      // S3 status: mock/local only — storageKey = mock-s3 路径
      const ts = Date.now();
      const storageKey = `mock-s3://user-uploads/${activeAccountId}/${input.relatedStepKey}/${input.assetSubtype}/${ts}-${input.fileName}`;

      const asset = await prisma.asset.create({
        data: {
          accountId: activeAccountId!,
          assetType: 'user_upload',
          fileName: input.fileName,
          mimeType: input.fileMime,
          sizeBytes: input.fileSizeBytes,
          storageProvider: 'mock',
          storageKey,
          relatedStepKey: input.relatedStepKey,
          parsingStatus: 'pending',
          traceId: traceId ?? null,
        },
        select: { id: true },
      });

      // ── 5. 触发 file-parser job ───────────────────────────────────────────────
      try {
        await fileParserQueue.add(
          'parse-asset',
          {
            userId: user!.id,
            accountId: activeAccountId!,
            fileName: input.fileName,
            fileMime: input.fileMime,
            fileSize: input.fileSizeBytes,
            rawText: '',          // worker 会用 fileBuffer 路径，rawText 为备用
            fileBuffer: pureBase64,
            assetId: asset.id,
          },
          { jobId: `asset-${asset.id}` },
        );

        logger.info(
          { assetId: asset.id, accountId: activeAccountId, fileName: input.fileName, traceId },
          'asset.upload.enqueued',
        );
      } catch (err) {
        // job 入队失败 → 更新 parsingStatus 为 failed，但 Asset 已创建(前端仍拿到 assetId)
        logger.error({ err, assetId: asset.id, traceId }, 'asset.upload.enqueue_failed');
        await prisma.asset.update({
          where: { id: asset.id },
          data: { parsingStatus: 'failed', parsingError: 'enqueue_failed' },
        });
        // 非阻断性：前端仍能继续，只是解析会跳过
      }

      return { ok: true as const, assetId: asset.id };
    }),

  /**
   * summarizeStep1Assets — PRD-37 US-P08
   * 读取 step1 上传的 Asset.parsedText → LLM 梳理 → 写回 StepData(step1).result
   *
   * 触发时机：step1 handleSubmit 之后(parsedText 已由 worker 写入)
   * LLM KEY status: 待真跑 · 机制就绪 — 需要 ANTHROPIC_API_KEY；
   *                 Worker 解析可能尚未完成(async)→ 前端应在上传后给 worker 时间再调用此接口
   *                 或 polling parsingStatus=completed 后再调用。
   *                 此接口内部做 graceful skip: parsedText 为空则跳过 LLM，存空摘要。
   */
  summarizeStep1Assets: protectedProcedure
    .input(summarizeStep1AssetsInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId, user } = ctx;

      const allIds = [
        ...(input.productMaterialAssetIds ?? []),
        ...(input.personaFileAssetIds ?? []),
      ];

      if (allIds.length === 0) {
        return { ok: true as const, productSummary: null, personaSummary: null };
      }

      // 查 Asset.parsedText(只取 completed 的)
      const assets = await prisma.asset.findMany({
        where: {
          id: { in: allIds },
          accountId: activeAccountId!,
          parsingStatus: 'completed',
        },
        select: { id: true, parsedText: true },
      });

      const parsedById = new Map(assets.map((a) => [a.id, a.parsedText ?? '']));

      const productTexts = (input.productMaterialAssetIds ?? [])
        .map((id) => parsedById.get(id))
        .filter((t): t is string => !!t && t.trim() !== '');

      const personaTexts = (input.personaFileAssetIds ?? [])
        .map((id) => parsedById.get(id))
        .filter((t): t is string => !!t && t.trim() !== '');

      // ── LLM 梳理 ─────────────────────────────────────────────────────────────
      // 待真跑 · 机制就绪: 需 ANTHROPIC_API_KEY。
      // 当 parsedText 有内容时才调用 LLM；否则 graceful skip → 空摘要。
      // 使用现有 positioningAgent.llmGateway(lightweight tier · 15s timeout)。
      let productSummary: string | null = null;
      let personaSummary: string | null = null;

      if (productTexts.length > 0 || personaTexts.length > 0) {
        // 动态 import 避免循环依赖 + 保持 API KEY 就绪时才真调用
        const { positioningAgent } = await import('@/specialists/PositioningAgent');
        // FRAGILE_COUPLING_DEBT: llmGateway is protected in BaseSpecialist; this cast bypasses
        // TypeScript's access control. A public getter on BaseSpecialist (or a dedicated factory
        // that returns the gateway directly) would eliminate this unsafe cast. Track as tech-debt.
        const llm = (positioningAgent as unknown as { llmGateway: ILLMGateway }).llmGateway;

        // Zod schemas for structured output (LLMCompleteRequest.responseFormat.schema is ZodType)
        const productSummarySchema = z.object({ productSummary: z.string() });
        const personaSummarySchema = z.object({ personaSummary: z.string() });

        if (productTexts.length > 0) {
          try {
            const result = await llm.complete({
              model_tier: 'lightweight',
              systemPrompt: '你是专业的 IP 运营顾问，擅长从产品资料中提炼核心价值主张。',
              userPrompt: buildProductSummaryPrompt(productTexts),
              responseFormat: {
                type: 'json_schema' as const,
                schema: productSummarySchema,
              },
              metadata: {
                trace_id: traceId ?? '',
                agentId: 'AssetSummaryAgent',
                accountId: activeAccountId!,
                userId: user!.id,
              },
              timeout_ms: 30_000,
              retry: 1,
            });
            // content is the parsed JSON object (when responseFormat=json_schema) or a string
            const content = typeof result.content === 'string'
              ? (JSON.parse(result.content) as { productSummary?: string })
              : (result.content as { productSummary?: string });
            productSummary = content.productSummary ?? null;
          } catch (err) {
            logger.warn({ err, accountId: activeAccountId, traceId }, 'asset.summarize.product_llm_failed');
            // graceful: 写 null，不阻断整体流程
          }
        }

        if (personaTexts.length > 0) {
          try {
            const result = await llm.complete({
              model_tier: 'lightweight',
              systemPrompt: '你是专业的 IP 运营顾问，擅长从人物介绍中提炼 IP 价值主张。',
              userPrompt: buildPersonaSummaryPrompt(personaTexts),
              responseFormat: {
                type: 'json_schema' as const,
                schema: personaSummarySchema,
              },
              metadata: {
                trace_id: traceId ?? '',
                agentId: 'AssetSummaryAgent',
                accountId: activeAccountId!,
                userId: user!.id,
              },
              timeout_ms: 30_000,
              retry: 1,
            });
            const content = typeof result.content === 'string'
              ? (JSON.parse(result.content) as { personaSummary?: string })
              : (result.content as { personaSummary?: string });
            personaSummary = content.personaSummary ?? null;
          } catch (err) {
            logger.warn({ err, accountId: activeAccountId, traceId }, 'asset.summarize.persona_llm_failed');
          }
        }
      }

      // ── 写回 StepData(step1).result ──────────────────────────────────────────
      if (productSummary !== null || personaSummary !== null) {
        await prisma.stepData.updateMany({
          where: {
            accountId: activeAccountId!,
            stepKey: 'step1',
          },
          data: {
            result: {
              productSummary,
              personaSummary,
            } as Prisma.InputJsonValue,
          },
        });

        logger.info(
          { accountId: activeAccountId, traceId, hasProduct: !!productSummary, hasPersona: !!personaSummary },
          'asset.summarize.written',
        );
      }

      return { ok: true as const, productSummary, personaSummary };
    }),
});
