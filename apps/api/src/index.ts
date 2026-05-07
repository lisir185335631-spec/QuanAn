/**
 * QuanQn · API server entry
 * Hono + @hono/node-server + tRPC v11 · US-003
 * AC-1: listen :3000 · cold start < 5s
 * AC-5: DATABASE_URL invalid → log 'DB connection failed' + exit 1
 * US-006: OAuth routes + CORS + startup validation
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { generateState } from 'arctic';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/trpc/routers/_app';
import { createContext } from '@/trpc/context';
import { checkDbConnection } from '@/lib/prisma';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { lucia } from '@/lib/auth/lucia';
import { getProvider, validateStartupConfig, requiresCsrfCheck } from '@/lib/auth/providers';

// Validate env at module load — exits early on misconfiguration (AC-10, AC-14)
validateStartupConfig();

const app = new Hono();

const allowedOrigin = process.env.APP_BASE_URL ?? 'http://localhost:5173';

app.use(
  '*',
  cors({
    origin: allowedOrigin,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── OAuth routes ───────────────────────────────────────────────────────────────

app.get('/auth/login', (c) => {
  let provider;
  try {
    provider = getProvider();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, msg);
    return c.json({ error: msg }, 500);
  }

  const state = generateState();
  const { url, codeVerifier } = provider.getAuthorizationUrl(state);

  // Store state (and optional codeVerifier) in cookies for CSRF validation
  setCookie(c, 'oauth_state', state, {
    path: '/',
    httpOnly: true,
    maxAge: 600,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
  });
  if (codeVerifier) {
    setCookie(c, 'oauth_code_verifier', codeVerifier, {
      path: '/',
      httpOnly: true,
      maxAge: 600,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return c.redirect(url.toString());
});

app.get('/auth/callback', async (c) => {
  const searchParams = c.req.query();
  const code = searchParams['code'] ?? '';
  const state = searchParams['state'] ?? '';
  const storedState = getCookie(c, 'oauth_state') ?? '';
  const codeVerifier = getCookie(c, 'oauth_code_verifier');
  const traceId = 'pending'; // US-007 will inject real trace_id

  let provider;
  try {
    provider = getProvider();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, msg);
    return c.json({ error: msg }, 500);
  }

  // CSRF check — only the mock provider skips this; ?mock=true query param is never consulted
  if (requiresCsrfCheck(provider.name)) {
    if (!state || state !== storedState) {
      logger.warn({ traceId }, 'oauth_state_mismatch');
      await prisma.auditLog
        .create({
          data: {
            eventType: 'security_alert',
            eventCategory: 'security',
            success: false,
            errorCode: 'oauth_state_mismatch',
            payload: { event: 'oauth_state_mismatch' },
            traceId,
          },
        })
        .catch(() => undefined);
      return c.json({ error: 'state mismatch' }, 401);
    }
  }

  let userInfo;
  try {
    userInfo = await provider.validateCallback({ code, state, storedState, codeVerifier });
  } catch (err) {
    logger.error({ err }, 'oauth.callback.failed');
    return c.json({ error: 'OAuth callback failed' }, 500);
  }

  // Upsert user — AC-5, AC-12
  const user = await prisma.user.upsert({
    where: { openId: userInfo.openId },
    update: { lastSignedIn: new Date() },
    create: {
      openId: userInfo.openId,
      email: userInfo.email,
      name: userInfo.name,
      loginMethod: provider.name,
      lastSignedIn: new Date(),
    },
  });

  // Create lucia session
  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  // Write session cookie manually to ensure sameSite/secure per AC-2/15
  const isProduction = process.env.NODE_ENV === 'production';
  setCookie(c, sessionCookie.name, sessionCookie.value, {
    path: '/',
    httpOnly: true,
    maxAge: sessionCookie.attributes.maxAge,
    sameSite: 'Lax',
    secure: isProduction,
  });

  // Audit log — AC-6
  await prisma.auditLog
    .create({
      data: {
        userId: user.id,
        eventType: 'auth.login',
        eventCategory: 'auth',
        payload: { provider: provider.name },
        traceId,
      },
    })
    .catch(() => undefined);

  // Clear state cookies
  deleteCookie(c, 'oauth_state', { path: '/' });
  deleteCookie(c, 'oauth_code_verifier', { path: '/' });

  return c.redirect(allowedOrigin + '/');
});

app.get('/auth/logout', async (c) => {
  const sessionId = lucia.readSessionCookie(c.req.header('cookie') ?? '');
  if (sessionId) {
    await lucia.invalidateSession(sessionId).catch(() => undefined);
  }
  const blank = lucia.createBlankSessionCookie();
  setCookie(c, blank.name, blank.value, {
    path: '/',
    httpOnly: true,
    maxAge: 0,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return c.redirect(allowedOrigin + '/');
});

// ── tRPC ───────────────────────────────────────────────────────────────────────

app.all('/trpc/*', (c) =>
  fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => createContext(c),
    onError: ({ error, path }) => {
      logger.error({ path, code: error.code }, error.message);
    },
  }),
);

const PORT = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
  await checkDbConnection();
  serve({ fetch: app.fetch, port: PORT });
  logger.info({ port: PORT }, 'server.starting');
}

start().catch((err) => {
  logger.error({ err }, 'server.start.failed');
  process.exit(1);
});
