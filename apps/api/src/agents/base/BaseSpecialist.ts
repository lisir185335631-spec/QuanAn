/**
 * QuanQn · BaseSpecialist 抽象类(模板方法模式)
 * 派生自 ARCHITECTURE.md §6.3 + ADR-003 + LD-005
 *
 * 全 14 Specialist 必继承此类(R-2 grep 检测)
 * 子类只实现 execute() · run() 自动处理 trace + 错误捕获 + 计时 + 日志
 */

import { logger } from '@/lib/logger';
import { contextAssembler } from '@/services/context-assembler/ContextAssembler';

import { generateSpecialistTraceId } from './types';

import type {
  SpecialistInput,
  SpecialistOutput,
  SpecialistConfig,
  AssembledContext,
  SpecialistId,
} from './types';

export abstract class BaseSpecialist<P = unknown, R = unknown> {
  abstract readonly id: SpecialistId;
  abstract readonly config: SpecialistConfig;

  /**
   * 模板方法 · 不可重写
   * 处理 · trace_id 生成 · 输入校验 · ContextAssembler 调用 · 异常捕获 · 耗时统计 · 审计日志
   */
  async run(input: SpecialistInput<P>): Promise<SpecialistOutput<R>> {
    const traceId = input.trace_id ?? generateSpecialistTraceId(input.accountId, this.id);
    const startedAt = Date.now();

    logger.info({ traceId, agentId: this.id, accountId: input.accountId }, 'specialist.start');

    try {
      this.validateInput(input);

      const ctx = await contextAssembler.assemble({
        agentId: this.id,
        accountId: input.accountId,
        mode: input.mode,
        userInput: input.payload,
        needRag: this.config.knowledge.rag,
      }) as unknown as AssembledContext;

      const result = await this.execute(input, ctx);

      const durationMs = Date.now() - startedAt;
      logger.info({ traceId, agentId: this.id, durationMs }, 'specialist.success');

      return { ...result, trace_id: traceId, durationMs };
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      logger.error({ traceId, agentId: this.id, err, durationMs }, 'specialist.failed');
      throw err;
    }
  }

  /** 子类实现的核心方法 · 单次 LLM 调用 + zod 校验(R-3 不允许循环调) */
  protected abstract execute(
    input: SpecialistInput<P>,
    ctx: AssembledContext,
  ): Promise<SpecialistOutput<R>>;

  /** 输入校验 · 子类可重写 */
  protected validateInput(input: SpecialistInput<P>): void {
    if (!input.accountId || input.accountId <= 0) throw new Error('Invalid accountId');
    if (input.agentId !== this.id) throw new Error(`Agent mismatch: expected ${this.id}, got ${input.agentId}`);
  }
}
