/**
 * Unit tests for OAuth provider abstraction — US-006
 * AC-1, AC-8, AC-10, AC-14: provider selection + CSRF check + startup validation
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { MockProvider, validateStartupConfig, requiresCsrfCheck } from '../../../apps/api/src/lib/auth/providers';

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
  const origNodeEnv = process.env['NODE_ENV'];

  afterEach(() => {
    process.env['SESSION_SECRET'] = origSecret;
    process.env['OAUTH_PROVIDER'] = origProvider;
    process.env['NODE_ENV'] = origNodeEnv;
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

  it('calls process.exit(1) when NODE_ENV=production and OAUTH_PROVIDER=mock', () => {
    process.env['SESSION_SECRET'] = 'a'.repeat(32);
    process.env['OAUTH_PROVIDER'] = 'mock';
    process.env['NODE_ENV'] = 'production';
    const exitSpy = vi
      .spyOn(process, 'exit')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((_code?: number) => { throw new Error('exit'); }) as any;
    expect(() => validateStartupConfig()).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

// AC-8: CSRF enforcement logic
describe('requiresCsrfCheck', () => {
  it('returns false for mock provider (name=mock) — dev only', () => {
    expect(requiresCsrfCheck('mock')).toBe(false);
  });

  it('returns true for google provider — always enforced', () => {
    expect(requiresCsrfCheck('google')).toBe(true);
  });

  it('returns true for any unknown real provider', () => {
    expect(requiresCsrfCheck('github')).toBe(true);
  });

  it('attack scenario: ?mock=true query param cannot bypass CSRF for google provider', () => {
    // Before fix: requiresCsrfCheck(isMockRequest=true, 'google') returned false — VULNERABLE.
    // After fix: requiresCsrfCheck only inspects providerName, never attacker-controlled query params.
    // An attacker constructing /auth/callback?mock=true&code=X&state=W against a google-configured
    // server will still hit CSRF validation and receive 401.
    expect(requiresCsrfCheck('google')).toBe(true);
  });
});
