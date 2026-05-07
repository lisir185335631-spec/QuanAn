/**
 * Unit tests for OAuth provider abstraction — US-006
 * AC-1, AC-10, AC-14: provider selection + startup validation
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { MockProvider, validateStartupConfig } from '../../../apps/api/src/lib/auth/providers';

describe('MockProvider', () => {
  it('validateCallback always returns mock dev user', async () => {
    const provider = new MockProvider();
    const info = await provider.validateCallback({ code: 'x', state: 'y', storedState: 'y' });
    expect(info).toEqual({ openId: 'mock-dev-001', email: 'dev@local.test', name: 'Dev User' });
  });

  it('getAuthorizationUrl returns URL with /auth/callback?mock=true', () => {
    const provider = new MockProvider();
    const { url } = provider.getAuthorizationUrl('any-state');
    expect(url.pathname).toBe('/auth/callback');
    expect(url.searchParams.get('mock')).toBe('true');
  });
});

describe('validateStartupConfig', () => {
  const origSecret = process.env['SESSION_SECRET'];
  const origProvider = process.env['OAUTH_PROVIDER'];

  afterEach(() => {
    process.env['SESSION_SECRET'] = origSecret;
    process.env['OAUTH_PROVIDER'] = origProvider;
    vi.restoreAllMocks();
  });

  it('calls process.exit(1) when SESSION_SECRET < 32 chars', () => {
    process.env['SESSION_SECRET'] = 'tooshort';
    const exitSpy = vi
      .spyOn(process, 'exit')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((_code?: number) => { throw new Error('exit'); }) as any;
    expect(() => validateStartupConfig()).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('calls process.exit(1) when OAUTH_PROVIDER is unknown', () => {
    process.env['SESSION_SECRET'] = 'a'.repeat(32);
    process.env['OAUTH_PROVIDER'] = 'facebook';
    const exitSpy = vi
      .spyOn(process, 'exit')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((_code?: number) => { throw new Error('exit'); }) as any;
    expect(() => validateStartupConfig()).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
