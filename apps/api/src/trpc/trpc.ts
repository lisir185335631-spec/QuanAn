/**
 * tRPC init — v11 · US-003
 * Procedures available: publicProcedure (no auth guard · US-006 will add authedProcedure)
 */

import { initTRPC } from '@trpc/server';
import type { TRPCContext } from '@/trpc/context';

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
