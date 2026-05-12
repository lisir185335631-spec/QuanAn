// PRD-10 US-002 · admin.auth router
// 3 procedures: login · logout · me
// AC-6: registered to adminRouter.auth

import { createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { luciaAdmin, createAdminIdleKey, deleteAdminIdleKey } from '@/lib/auth/lucia-admin';
import { getAdminOAuthProvider } from '@/lib/auth/oauth-admin-factory';
import { adminTrpcRouter, publicAdminProcedure } from '@/trpc/trpc-admin';

const isProduction = process.env.NODE_ENV === 'production';
const SESSION_MAX_AGE = 12 * 60 * 60; // 12h in seconds

function makeCookieStr(name: string, value: string, maxAge: number): string {
  const parts = [
    `${name}=${value}`,
    'HttpOnly',
    'SameSite=Lax',
    `Path=/`,
    `Max-Age=${maxAge}`,
  ];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

function makePayloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export const adminAuthRouter = adminTrpcRouter({
  /** Mock OAuth login (dev) / Google Workspace (prod stub). */
  login: publicAdminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      const oauthProvider = getAdminOAuthProvider();

      let adminUser: { id: number; email: string; role: string; isMock: boolean; isActive: boolean };
      let loginSuccess = false;

      try {
        adminUser = await oauthProvider(email);
        loginSuccess = true;
      } catch (err) {
        const code =
          err instanceof Error && 'code' in err
            ? (err as { code: string }).code
            : 'login_failed';

        // Write failed audit log (AC-14)
        const failPayload = { email, reason: code };
        await ctx.prisma.adminAuditLog.create({
          data: {
            actorAdminId: 0,
            actorRole: 'unknown',
            eventCategory: 'auth',
            eventType: 'admin_login',
            payloadHash: makePayloadHash(failPayload),
            payload: failPayload,
            traceId: ctx.traceId,
            ip: ctx.req.headers.get('x-forwarded-for') ?? '0.0.0.0',
            userAgent: ctx.req.headers.get('user-agent') ?? '',
            sessionId: '',
            success: false,
            errorCode: code,
            errorMessage: err instanceof Error ? err.message : 'login_failed',
          },
        }).catch(() => undefined);

        if (code === 'user_not_found') {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'user_not_found' });
        }
        if (code === 'user_inactive') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'user_inactive' });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'login_failed' });
      }

      // Create session
      const session = await luciaAdmin.createSession(adminUser.id, {});
      await createAdminIdleKey(session.id);

      // Set cookie via resHeaders (tRPC v11 fetch adapter propagates to response)
      ctx.resHeaders.append('Set-Cookie', makeCookieStr('admin_session_id', session.id, SESSION_MAX_AGE));

      // Write success audit log (AC-14)
      if (loginSuccess) {
        const successPayload = { email: adminUser.email, role: adminUser.role };
        await ctx.prisma.adminAuditLog.create({
          data: {
            actorAdminId: adminUser.id,
            actorRole: adminUser.role,
            eventCategory: 'auth',
            eventType: 'admin_login',
            payloadHash: makePayloadHash(successPayload),
            payload: successPayload,
            traceId: ctx.traceId,
            ip: ctx.req.headers.get('x-forwarded-for') ?? '0.0.0.0',
            userAgent: ctx.req.headers.get('user-agent') ?? '',
            sessionId: session.id,
            success: true,
          },
        }).catch(() => undefined);
      }

      return {
        sessionId: session.id,
        user: { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      };
    }),

  /** Invalidate admin session and clear cookie. */
  logout: publicAdminProcedure.mutation(async ({ ctx }) => {
    if (ctx.adminSession) {
      await Promise.all([
        luciaAdmin.invalidateSession(ctx.adminSession.id),
        deleteAdminIdleKey(ctx.adminSession.id),
      ]);
    }
    ctx.resHeaders.append('Set-Cookie', makeCookieStr('admin_session_id', '', 0));
    return { ok: true };
  }),

  /** Return current authenticated admin user, or throw UNAUTHORIZED. */
  me: publicAdminProcedure.query(({ ctx }) => {
    if (!ctx.activeAdminUser || !ctx.adminSession) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'unauthenticated' });
    }
    return {
      id: ctx.activeAdminUser.id,
      email: ctx.activeAdminUser.email,
      role: ctx.activeAdminUser.role,
      sessionId: ctx.adminSession.id,
    };
  }),
});
