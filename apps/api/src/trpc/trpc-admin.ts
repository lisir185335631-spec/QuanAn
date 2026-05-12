// PRD-10 US-002 · Admin tRPC init (separate instance from main app tRPC)
// Uses AdminTRPCContext — context isolated from main app session

import { initTRPC } from '@trpc/server';

import type { AdminTRPCContext } from '@/server/context-admin';

const t = initTRPC.context<AdminTRPCContext>().create();

export const adminTrpcRouter = t.router;
export const publicAdminProcedure = t.procedure;
