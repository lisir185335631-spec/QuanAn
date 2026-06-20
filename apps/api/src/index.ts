/**
 * QuanAn · API server entry
 * Hono + @hono/node-server + tRPC v11 · US-003
 * AC-1: listen :3000 · cold start < 5s
 * AC-5: DATABASE_URL invalid → log 'DB connection failed' + exit 1
 * US-006: OAuth routes + CORS + startup validation
 * US-007: Hono trace middleware — echoes X-Trace-Id in every response
 */

import { randomBytes } from 'node:crypto';

import { serve } from '@hono/node-server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { generateState } from 'arctic';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { cors } from 'hono/cors';

import { registerBackgroundTasks } from '@/background-tasks';
import { lucia } from '@/lib/auth/lucia';
import { validateAdminStartupConfig } from '@/lib/auth/oauth-admin-factory';
import { getProvider, validateStartupConfig, requiresCsrfCheck } from '@/lib/auth/providers';
import { validateEnv } from '@/lib/env';
import { logger, traceStore } from '@/lib/logger';
import { checkDbConnection , prisma } from '@/lib/prisma';
import { updateLastLogin, DEV_MOCK_USER_EMAIL } from '@/middleware/auth';
import { createAdminContext } from '@/server/context-admin';
import { createContext } from '@/trpc/context';
import { appRouter } from '@/trpc/routers/_app';
import { adminRouter } from '@/trpc/routers/admin';
import { handleExportUsersCSV } from '@/trpc/routers/admin/users';

// Validate env at module load — exits early on misconfiguration (AC-10, AC-14)
validateStartupConfig();
validateAdminStartupConfig();

// LLM env validation — warns on missing keys + logs mode (real / fallback)
const _llmEnv = validateEnv();
logger.info(
  {
    llmMode: _llmEnv.llmMode,
    model: _llmEnv.LLM_DEFAULT_MODEL,
    openAiKey: _llmEnv.OPENAI_API_KEY ? '✓' : '✗ fallback',
    anthropicKey: _llmEnv.ANTHROPIC_API_KEY ? '✓' : '✗ fallback',
  },
  'llm.init',
);

const app = new Hono();

const allowedOrigin = process.env.APP_BASE_URL ?? 'http://localhost:5173';
const adminAllowedOrigin = process.env.ADMIN_BASE_URL ?? 'http://localhost:5174';
const corsHeaders = ['Content-Type', 'Authorization', 'trpc-accept', 'x-trace-id', 'X-Trace-Id'];

// Admin SPA CORS must be registered BEFORE main app CORS.
// Hono CORS middleware early-returns on OPTIONS without calling next(),
// so the more-specific /trpc/admin/* pattern must come first.
app.use(
  '/admin/export/*',
  cors({
    origin: adminAllowedOrigin,
    credentials: true,
    allowHeaders: [...corsHeaders, 'Range'],
    allowMethods: ['GET', 'OPTIONS'],
    exposeHeaders: ['x-trace-id', 'Content-Disposition'],
  }),
);

app.use(
  '/trpc/admin/*',
  cors({
    origin: adminAllowedOrigin,
    credentials: true,
    allowHeaders: corsHeaders,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['x-trace-id'],
  }),
);

// Main app CORS
app.use(
  '/trpc/*',
  cors({
    origin: allowedOrigin,
    credentials: true,
    allowHeaders: corsHeaders,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['x-trace-id'],
  }),
);

// Health + OAuth routes CORS (main app)
app.use(
  '*',
  cors({
    origin: [allowedOrigin, adminAllowedOrigin],
    credentials: true,
    allowHeaders: corsHeaders,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['x-trace-id'],
  }),
);

// ── Trace middleware — AC-5/AC-6 (US-007) ─────────────────────────────────────
// Sets X-Trace-Id response header and propagates traceId via AsyncLocalStorage.
app.use('*', async (c, next) => {
  const traceId =
    c.req.header('x-trace-id') ??
    c.req.header('X-Trace-Id') ??
    randomBytes(8).toString('hex');
  await traceStore.run({ traceId }, async () => {
    await next();
  });
  c.header('x-trace-id', traceId);
});

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
  // US-007: real traceId from AsyncLocalStorage (set by Hono trace middleware above)
  const traceId = traceStore.getStore()?.traceId ?? randomBytes(8).toString('hex');

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

  // Update last login timestamp + IP (AC-6 US-005 · non-blocking)
  const clientIp =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    undefined;
  void updateLastLogin(prisma, user.id, clientIp);

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

// ── Dev-only instant login (NODE_ENV=development) ─────────────────────────────
// GET /auth/dev-login — creates or reuses the mock dev user session without OAuth.
// Used by e2e tests and agent-browser validation to bootstrap auth quickly.
// Guard: only registered when NODE_ENV=development so it can never run in prod.
if (process.env.NODE_ENV === 'development') {
  app.get('/auth/dev-login', async (c) => {
    const devEmail = DEV_MOCK_USER_EMAIL;
    let devUser = await prisma.user.upsert({
      where: { email: devEmail },
      update: { lastSignedIn: new Date() },
      create: {
        openId: 'dev-mock-001',
        email: devEmail,
        name: 'Dev User',
        loginMethod: 'mock',
        lastSignedIn: new Date(),
      },
    });
    // Ensure dev user has an activeAccountId so protectedProcedure works
    if (!devUser.activeAccountId) {
      let firstAccount = await prisma.ipAccount.findFirst({
        where: { userId: devUser.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      // Create a default mock account if user has none (e2e bootstrap)
      if (!firstAccount) {
        firstAccount = await prisma.ipAccount.create({
          data: {
            userId: devUser.id,
            name: 'AI 创业者小张',
            industry: 'enterprise',
            platform: 'douyin',
            stage: 'starter',
            followersRange: '0-1000',
            ipPositioning: 'ip-creator',
          },
          select: { id: true },
        });
      }
      devUser = await prisma.user.update({
        where: { id: devUser.id },
        data: { activeAccountId: firstAccount.id },
      });
    }
    const session = await lucia.createSession(devUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    setCookie(c, sessionCookie.name, sessionCookie.value, {
      path: '/',
      httpOnly: true,
      maxAge: sessionCookie.attributes.maxAge,
      sameSite: 'Lax',
      secure: false,
    });
    const next = c.req.query('next') ?? '/';
    return c.redirect(allowedOrigin + next);
  });
}

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

// ── Admin REST: CSV export (US-008) ───────────────────────────────────────────
// GET /admin/export/users — streams CSV; auth via admin session cookie
app.get('/admin/export/users', (c) => handleExportUsersCSV(c.req.raw));

// ── HTTP body size limit (P1 · 防 27MB base64 生产 413) ──────────────────────────
// 必须在 tRPC 路由前注册；30MB = 文件 20MB + base64 开销 (~33%) + 余量
// 超限时 Hono bodyLimit 默认返回 HTTP 413 Payload Too Large
app.use(
  '/trpc/*',
  bodyLimit({
    maxSize: 30 * 1024 * 1024, // 30 MB
    onError: (c) => c.json({ error: 'Payload Too Large (max 30 MB)' }, 413),
  }),
);

// ── Admin tRPC (mounted before main tRPC so /trpc/admin/* routes here first) ──

app.all('/trpc/admin/*', (c) =>
  fetchRequestHandler({
    endpoint: '/trpc/admin',
    req: c.req.raw,
    router: adminRouter,
    createContext: (opts) => createAdminContext(opts),
    onError: ({ error, path }) => {
      logger.error({ path, code: error.code }, error.message);
    },
  }),
);

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

  // 后台任务集中注册(dev-only worker + 常驻 cron)· 声明表见 @/background-tasks · 新增任务加一条目即可
  await registerBackgroundTasks({ isDev: process.env.NODE_ENV === 'development' });

  serve({ fetch: app.fetch, port: PORT });
  logger.info({ port: PORT }, 'server.starting');
}

start().catch((err: unknown) => {
  logger.error({ err }, 'server.start.failed');
  process.exit(1);
});
