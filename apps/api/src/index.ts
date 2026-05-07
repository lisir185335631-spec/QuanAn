/**
 * QuanQn · 后端入口(stub · P1 阶段填充)
 * 派生自 ARCHITECTURE.md §2.2 · Hono + tRPC
 *
 * P1 退出条件 · 13 router 全跑通 mock + RLS 测试通过
 */

import { Hono } from 'hono';
import { logger } from '@/lib/logger';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// TODO P1 · tRPC adapter
// import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
// import { appRouter } from './trpc/routers/_app';
// import { createContext } from './trpc/context';
// app.all('/api/trpc/*', (c) =>
//   fetchRequestHandler({
//     endpoint: '/api/trpc',
//     req: c.req.raw,
//     router: appRouter,
//     createContext: () => createContext(c),
//   }),
// );

const PORT = Number(process.env.PORT ?? 3000);
logger.info({ port: PORT }, 'server.starting');

export default { port: PORT, fetch: app.fetch };
