/**
 * QuanQn · API server entry
 * Hono + @hono/node-server + tRPC v11 · US-003
 * AC-1: listen :3000 · cold start < 5s
 * AC-2: GET /trpc/auth.me → { result: { data: { ok: false, error: 'unauthenticated' } } }
 * AC-5: DATABASE_URL invalid → log 'DB connection failed' + exit 1
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/trpc/routers/_app';
import { createContext } from '@/trpc/context';
import { checkDbConnection } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

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
