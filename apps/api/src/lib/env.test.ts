import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateEnv } from '@/lib/env';

describe('validateEnv', () => {
  let savedOpenAI: string | undefined;
  let savedAnthropic: string | undefined;
  let savedModel: string | undefined;
  let savedNodeEnv: string | undefined;

  beforeEach(() => {
    savedOpenAI = process.env['OPENAI_API_KEY'];
    savedAnthropic = process.env['ANTHROPIC_API_KEY'];
    savedModel = process.env['LLM_DEFAULT_MODEL'];
    savedNodeEnv = process.env['NODE_ENV'];

    delete process.env['OPENAI_API_KEY'];
    delete process.env['ANTHROPIC_API_KEY'];
    delete process.env['LLM_DEFAULT_MODEL'];
    delete process.env['NODE_ENV'];
  });

  afterEach(() => {
    if (savedOpenAI !== undefined) process.env['OPENAI_API_KEY'] = savedOpenAI;
    else delete process.env['OPENAI_API_KEY'];

    if (savedAnthropic !== undefined) process.env['ANTHROPIC_API_KEY'] = savedAnthropic;
    else delete process.env['ANTHROPIC_API_KEY'];

    if (savedModel !== undefined) process.env['LLM_DEFAULT_MODEL'] = savedModel;
    else delete process.env['LLM_DEFAULT_MODEL'];

    if (savedNodeEnv !== undefined) process.env['NODE_ENV'] = savedNodeEnv;
    else delete process.env['NODE_ENV'];

    vi.restoreAllMocks();
  });

  it('(a) 全 key 存在 → mode=real', () => {
    process.env['OPENAI_API_KEY'] = 'sk-test-key';
    process.env['ANTHROPIC_API_KEY'] = 'ant-test-key';
    const warnSpy = vi.spyOn(console, 'warn');
    vi.spyOn(console, 'info').mockImplementation(() => {});

    const env = validateEnv();

    expect(env.llmMode).toBe('real');
    expect(env.OPENAI_API_KEY).toBe('sk-test-key');
    expect(env.ANTHROPIC_API_KEY).toBe('ant-test-key');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('(b) key 缺 → mode=fallback + warning log', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});

    const env = validateEnv();

    expect(env.llmMode).toBe('fallback');
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('(c) LLM_DEFAULT_MODEL default claude-sonnet-4-6', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});

    const env = validateEnv();

    expect(env.LLM_DEFAULT_MODEL).toBe('claude-sonnet-4-6');
  });

  it('(d) NODE_ENV default development', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});

    const env = validateEnv();

    expect(env.NODE_ENV).toBe('development');
  });

  it('(e) malformed env → throw', () => {
    process.env['NODE_ENV'] = 'staging';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => validateEnv()).toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });
});
