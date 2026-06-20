/**
 * Context budget constants & token estimation utilities
 *
 * G1 token 预算约束 — 给 ContextAssembler 真实裁剪提供基础
 *
 * MAX_CONTEXT_TOKENS: 对 gpt-4o 128k 上下文留安全余量 (response ~4096 tokens)
 * LLM_MAX_CONTEXT_TOKENS 环境变量可覆盖(如切换到 32k 模型时传入 28000)
 */

export const MAX_CONTEXT_TOKENS = Number(process.env.LLM_MAX_CONTEXT_TOKENS ?? 110_000);

/**
 * 改进版 token 估算 — 解决 chars/4 对中文严重低估的问题
 *
 * ASCII 字符(英文/数字/标点) ≈ 0.25 token (即 4 chars = 1 token)
 * 非 ASCII 字符(CJK 汉字、日文等)   ≈ 1.5 token  (BPE 通常 1-2 tokens/字)
 *
 * 示例:
 *   estimateTokens("hello world")  → ceil(11 * 0.25) = 3
 *   estimateTokens("你好世界")      → ceil(4 * 1.5)  = 6   (同字数英文只算 1)
 */
export function estimateTokens(text: string): number {
  const raw = [...text].reduce((n, ch) => n + (ch.charCodeAt(0) < 128 ? 0.25 : 1.5), 0);
  return Math.ceil(raw);
}
