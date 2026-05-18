/**
 * QuanQn · API server entry
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
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { cors } from 'hono/cors';

import { lucia } from '@/lib/auth/lucia';
import { validateAdminStartupConfig } from '@/lib/auth/oauth-admin-factory';
import { getProvider, validateStartupConfig, requiresCsrfCheck } from '@/lib/auth/providers';
import { updateLastLogin } from '@/middleware/auth';
import { logger, traceStore } from '@/lib/logger';
import { checkDbConnection , prisma } from '@/lib/prisma';
import { createAdminContext } from '@/server/context-admin';
import { createContext } from '@/trpc/context';
import { appRouter } from '@/trpc/routers/_app';
import { adminRouter } from '@/trpc/routers/admin';
import { handleExportUsersCSV } from '@/trpc/routers/admin/users';

// Validate env at module load — exits early on misconfiguration (AC-10, AC-14)
validateStartupConfig();
validateAdminStartupConfig();

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

  // Dev mode: run image-gen worker in-process (AC-11 US-010)
  // Prod: worker runs as standalone `pnpm worker:image-gen` container
  if (process.env.NODE_ENV === 'development') {
    const { worker: imageWorker } = await import('./workers/image-gen/worker');
    imageWorker.on('error', (err) => logger.error({ err }, 'image_gen_worker.error'));
    logger.info('image_gen_worker.started_in_process');

    // AC-6 US-007: daily-task worker in-process (dev mode)
    const { dailyTaskWorker } = await import('./workers/daily-task/worker');
    dailyTaskWorker.on('error', (err) => logger.error({ err }, 'daily_task_worker.error'));
    logger.info('daily_task_worker.started_in_process');
  }

  // AC-3 US-007: start daily-task cron (0 0 * * * Asia/Shanghai)
  const { dailyTaskCron } = await import('./cron/daily-task-runner');
  dailyTaskCron.start();
  logger.info('daily_task_cron.started');

  // AC-5 US-002: register KPI snapshot BullMQ cron jobs (daily/weekly/monthly)
  const { scheduleDailySnapshot, scheduleWeeklySnapshot, scheduleMonthlySnapshot } =
    await import('./jobs/admin/kpi-snapshot.job');
  await scheduleDailySnapshot();
  await scheduleWeeklySnapshot();
  await scheduleMonthlySnapshot();
  logger.info('kpi_snapshot_crons.registered');

  // AC-H-5 US-009: register anomaly-detection cron (0 5 * * * Asia/Shanghai)
  const { scheduleAnomalyDetection } = await import('./jobs/admin/anomaly-detection.job');
  await scheduleAnomalyDetection();
  logger.info('anomaly_detection_cron.registered');

  // AC-10 US-015: register cost-anomaly detection cron (15 * * * * Asia/Shanghai)
  const { scheduleCostAnomalyDetection } = await import('./jobs/admin/cost-anomaly.job');
  await scheduleCostAnomalyDetection();

  // AC-1 US-012: register violation-detection cron (0 4 * * * Asia/Shanghai)
  const { scheduleViolationDetection } = await import('./jobs/admin/violation-detection.job');
  await scheduleViolationDetection();
  logger.info('violation_detection_cron.registered');

  // AC-6 US-002 PRD-13: register emergency-post-review cron (0 30 3 * * * Asia/Shanghai)
  const { scheduleEmergencyPostReview } = await import('./jobs/admin/emergency-post-review.job');
  await scheduleEmergencyPostReview();
  logger.info('emergency_post_review_cron.registered');

  // AC-8 US-005 PRD-13: register quota-expiry cleanup cron (0 30 0 * * * Asia/Shanghai)
  const { scheduleQuotaCleanup } = await import('./jobs/admin/quota-expiry.job');
  await scheduleQuotaCleanup();
  logger.info('quota_cleanup_cron.registered');

  // AC-1 US-003 PRD-14: register ab-stop-loss cron (0 0 * * * * hourly Asia/Shanghai)
  const { scheduleAbStopLoss } = await import('./jobs/admin/ab-stop-loss.job');
  await scheduleAbStopLoss();
  logger.info('ab_stop_loss_cron.registered');

  // AC-7 US-007 PRD-14: wire constantEmbedWorker (delayed embed rebuild after constant publish)
  const { constantEmbedWorker } = await import('./jobs/admin/constant-embed-rebuild.job');
  constantEmbedWorker.on('error', (err) => logger.error({ err }, 'constant_embed_worker.error'));
  logger.info('constant_embed_worker.registered');

  serve({ fetch: app.fetch, port: PORT });
  logger.info({ port: PORT }, 'server.starting');
}

start().catch((err: unknown) => {
  logger.error({ err }, 'server.start.failed');
  process.exit(1);
});
