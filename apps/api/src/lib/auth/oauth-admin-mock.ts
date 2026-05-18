// PRD-10 US-002 · Admin mock OAuth provider (dev only)
// AC-3: validates isMock=true + isActive=true · no real password check

import { prisma } from '@/lib/prisma';

export interface MockAdminUser {
  id: number;
  email: string;
  role: string;
  isMock: boolean;
  isActive: boolean;
}

/**
 * Mock OAuth callback for dev admin login.
 * Looks up admin_users by email, validates isMock=true + isActive=true.
 * Throws on user_not_found or user_inactive.
 */
export async function mockOAuthCallback(email: string): Promise<MockAdminUser> {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error('user_not_found'), { code: 'user_not_found' });
  }
  if (!user.isMock) {
    throw Object.assign(new Error('user_not_mock'), { code: 'user_not_mock' });
  }
  if (!user.isActive) {
    throw Object.assign(new Error('user_inactive'), { code: 'user_inactive' });
  }
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isMock: user.isMock,
    isActive: user.isActive,
  };
}
