// PRD-10 US-003 · adminRLS — $transaction + set_config('app.role','admin',true)
// AC-14 (LD-A3): grep 'set_config.*app.role.*admin' MUST match this file
// Injects ctx.adminPrisma (tx-scoped client) and sets ctx.crossAccountAccessed=true
import { middleware } from '@/trpc/trpc-admin';

import type { PrismaClient } from '@prisma/client';

export const adminRLSMiddleware = middleware(async ({ ctx, next }) => {
  return ctx.prisma.$transaction(
    async (tx) => {
      // set_config(name, value, is_local=true) — transaction-scoped, clears on commit/rollback
      await (tx as unknown as { $executeRawUnsafe: (sql: string) => Promise<unknown> }).$executeRawUnsafe(
        "SELECT set_config('app.role', 'admin', true)",
      );
      return next({
        ctx: {
          ...ctx,
          adminPrisma: tx as unknown as PrismaClient,
          crossAccountAccessed: true,
        },
      });
    },
    // 整个 admin 请求(set_config + 解析器查询 + 审计写)都跑在这一个交互事务里。
    // 默认 5s interactive timeout 在冷库/偶发慢查下会 P2028 超时(CI 冷启 reviewTrending.list 实测 5014ms,刚越线)。
    // timeout 是上限而非固定延迟 —— next() 一 resolve 即提交,放宽不影响正常请求耗时;
    // maxWait 给冷连接池"取到连接"留余量。
    { timeout: 30_000, maxWait: 10_000 },
  );
});
