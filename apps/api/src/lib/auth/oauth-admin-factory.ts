// PRD-10 US-002 · Admin OAuth provider factory + startup gate
// AC-4/AC-15: reads OAUTH_PROVIDER · prod startup gate (mock → exit 1)

import { logger } from '@/lib/logger';

import { googleWorkspaceOAuthStub } from './oauth-admin-google';
import { mockOAuthCallback } from './oauth-admin-mock';

export type AdminOAuthProvider = 'mock' | 'google';

export interface AdminOAuthResult {
  id: number;
  email: string;
  role: string;
  isMock: boolean;
  isActive: boolean;
}

/**
 * Returns the admin OAuth callback function based on OAUTH_PROVIDER env.
 * - 'mock': returns mockOAuthCallback (dev only)
 * - 'google': returns googleWorkspaceOAuthStub (stub, always throws PRR required)
 * - other: throws config error
 */
export function getAdminOAuthProvider(): (email: string) => Promise<AdminOAuthResult> {
  const provider = (process.env.OAUTH_PROVIDER ?? 'mock') as AdminOAuthProvider;

  if (provider === 'mock') {
    return mockOAuthCallback;
  }

  if (provider === 'google') {
    return (_email: string): Promise<AdminOAuthResult> => {
      googleWorkspaceOAuthStub(); // always throws — return is unreachable
    };
  }

  const unknownProvider: string = provider;
  logger.error(`unknown OAUTH_PROVIDER for admin: ${unknownProvider} · expected mock|google`);
  throw new Error(`unknown OAUTH_PROVIDER: ${unknownProvider}`);
}

/**
 * Validate admin startup config.
 * Exits if OAUTH_PROVIDER=mock in production (defense-in-depth, AC-15).
 */
export function validateAdminStartupConfig(): void {
  const provider = process.env.OAUTH_PROVIDER ?? 'mock';
  if (process.env.NODE_ENV === 'production' && provider === 'mock') {
    logger.error('OAUTH_PROVIDER=mock not allowed in production (admin)');
    process.exit(1);
  }
}
