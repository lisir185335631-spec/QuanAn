import { z } from 'zod';

export const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  LLM_DEFAULT_MODEL: z.string().default('claude-sonnet-4-6'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvShape = z.infer<typeof envSchema>;
export type Env = EnvShape & { llmMode: 'real' | 'fallback' };

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('[env] ENV validation failed:', result.error.format());
    throw new Error(`ENV validation failed: ${result.error.message}`);
  }

  const data = result.data;
  const hasLlmKey = !!(data.OPENAI_API_KEY || data.ANTHROPIC_API_KEY);
  const llmMode: 'real' | 'fallback' = hasLlmKey ? 'real' : 'fallback';

  if (!hasLlmKey) {
    console.warn(
      '[env] LLM keys not configured · OPENAI_API_KEY=✗ fallback · ANTHROPIC_API_KEY=✗ fallback · BaseSpecialist will use mock fallback',
    );
  }

  console.info(
    `[env] LLM mode=${llmMode} · OPENAI_API_KEY=${data.OPENAI_API_KEY ? '✓' : '✗ fallback'} · ANTHROPIC_API_KEY=${data.ANTHROPIC_API_KEY ? '✓' : '✗ fallback'} · model=${data.LLM_DEFAULT_MODEL}`,
  );

  return { ...data, llmMode };
}
