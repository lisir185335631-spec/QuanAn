// PRD-10 US-001 stub · US-003 真接 $transaction + set_config('app.role','admin',true)
// 类比 account-isolation.ts · admin bypass RLS on 13 admin tables + 18 main tables
import { middleware } from '@/trpc/trpc';

export const adminRLSMiddleware = middleware(async ({ next }) => {
  return next();
});
