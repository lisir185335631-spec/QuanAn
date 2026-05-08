/**
 * Lucia v3 instance — US-006
 * Session cookie name: app_session (distinct from admin_session per AGENTS §10 LD-A-1)
 */

import { Lucia } from 'lucia';
import { prismaAdapter } from './adapter';

const isProduction = process.env.NODE_ENV === 'production';

export const lucia = new Lucia(prismaAdapter, {
  sessionCookie: {
    name: 'app_session',
    attributes: {
      secure: isProduction,
      sameSite: 'lax',
    },
  },
  getUserAttributes(attrs) {
    return {
      email: attrs.email,
      name: attrs.name,
      activeAccountId: attrs.activeAccountId,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    UserId: number;
    DatabaseUserAttributes: {
      email: string;
      name: string;
      activeAccountId: number | null;
    };
  }
}
