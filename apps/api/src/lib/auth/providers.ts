/**
 * OAuth provider abstraction — US-006
 * AC-1: OAUTH_PROVIDER=mock|google selects the provider at startup.
 * AC-10: invalid value → process.exit(1)
 */

import { Google, generateCodeVerifier, decodeIdToken } from 'arctic';

import { logger } from '@/lib/logger';

export interface OAuthUserInfo {
  openId: string;
  email: string;
  name: string;
}

export interface OAuthProvider {
  readonly name: string;
  /** Returns authorization URL (and optional PKCE codeVerifier). */
  getAuthorizationUrl(state: string): { url: URL; codeVerifier?: string };
  /** Validates the callback, returns user info. Throws on CSRF/code failure. */
  validateCallback(params: {
    code: string;
    state: string;
    storedState: string;
    codeVerifier?: string;
  }): Promise<OAuthUserInfo>;
}

// ── Mock provider ──────────────────────────────────────────────────────────────

export class MockProvider implements OAuthProvider {
  readonly name = 'mock';

  getAuthorizationUrl(_state: string): { url: URL } {
    const base = process.env.API_BASE_URL ?? 'http://localhost:3000';
    const url = new URL(`${base}/auth/callback`);
    url.searchParams.set('mock', 'true');
    return { url };
  }

  validateCallback(_params: {
    code: string;
    state: string;
    storedState: string;
    codeVerifier?: string;
  }): Promise<OAuthUserInfo> {
    return Promise.resolve({ openId: 'mock-dev-001', email: 'dev@local.test', name: 'Dev User' });
  }
}

// ── Google provider ────────────────────────────────────────────────────────────

export class GoogleProvider implements OAuthProvider {
  readonly name = 'google';
  private readonly google: Google;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.google = new Google(clientId, clientSecret, redirectUri);
  }

  getAuthorizationUrl(state: string): { url: URL; codeVerifier: string } {
    const codeVerifier = generateCodeVerifier();
    const url = this.google.createAuthorizationURL(state, codeVerifier, [
      'openid',
      'email',
      'profile',
    ]);
    return { url, codeVerifier };
  }

  async validateCallback(params: {
    code: string;
    state: string;
    storedState: string;
    codeVerifier?: string;
  }): Promise<OAuthUserInfo> {
    const tokens = await this.google.validateAuthorizationCode(
      params.code,
      params.codeVerifier!,
    );
    const claims = decodeIdToken(tokens.idToken()) as {
      sub: string;
      email: string;
      name: string;
    };
    return { openId: claims.sub, email: claims.email, name: claims.name };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────────

let _provider: OAuthProvider | null = null;

export function getProvider(): OAuthProvider {
  if (_provider) return _provider;
  const providerName = process.env.OAUTH_PROVIDER ?? 'mock';

  if (providerName === 'mock') {
    _provider = new MockProvider();
    return _provider;
  }

  if (providerName === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URL ?? 'http://localhost:3000/auth/callback';
    // AC-9: missing client ID → runtime error logged but not exit(1) (returns 500)
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID missing for google provider');
    }
    _provider = new GoogleProvider(clientId, clientSecret, redirectUri);
    return _provider;
  }

  // AC-10: unknown provider → exit immediately
  logger.error(`unknown OAuth provider: ${providerName} · expected mock|google`);
  process.exit(1);
}

/**
 * Returns true if CSRF state validation must be enforced.
 * Only the mock provider skips CSRF (local dev · trusted runtime).
 * The ?mock=true query param does NOT influence this decision —
 * it is attacker-controllable input and must never short-circuit security.
 */
export function requiresCsrfCheck(providerName: string): boolean {
  return providerName !== 'mock';
}

/** Validate startup invariants: SESSION_SECRET length + OAUTH_PROVIDER value. */
export function validateStartupConfig(): void {
  const secret = process.env.SESSION_SECRET ?? '';
  if (secret.length < 32) {
    logger.error('SESSION_SECRET must be at least 32 characters');
    process.exit(1);
  }
  // Eagerly validate provider name so an unknown value exits at startup (AC-10)
  const providerName = process.env.OAUTH_PROVIDER ?? 'mock';
  if (providerName !== 'mock' && providerName !== 'google') {
    logger.error(`unknown OAuth provider: ${providerName} · expected mock|google`);
    process.exit(1);
  }
  // AC-15 extension: mock provider must not run in production
  if (process.env.NODE_ENV === 'production' && providerName === 'mock') {
    logger.error('OAUTH_PROVIDER=mock not allowed in production');
    process.exit(1);
  }
}
