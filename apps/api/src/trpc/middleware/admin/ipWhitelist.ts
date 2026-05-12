// PRD-10 US-003 · ipWhitelist — ADMIN_IP_WHITELIST_ENABLED + ipaddr.js CIDR check
import ipaddr from 'ipaddr.js';
import { TRPCError } from '@trpc/server';

import { middleware } from '@/trpc/trpc-admin';

export const ipWhitelistMiddleware = middleware(async ({ ctx, next }) => {
  if (process.env.ADMIN_IP_WHITELIST_ENABLED !== 'true') return next();

  const cidrList = (process.env.ADMIN_IP_WHITELIST_CIDRS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // ipaddr.process normalises IPv4-mapped IPv6 (::ffff:x.x.x.x) to plain IPv4
  const rawIp =
    ctx.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    ctx.req.headers.get('x-real-ip') ??
    '';

  let clientAddr: ReturnType<typeof ipaddr.parse> | null = null;
  try {
    clientAddr = ipaddr.process(rawIp);
  } catch {
    // unparseable IP — deny
  }

  let matched = false;
  if (clientAddr) {
    for (const cidr of cidrList) {
      try {
        const [range, prefixLen] = ipaddr.parseCIDR(cidr);
        if (clientAddr.kind() === range.kind() && clientAddr.match(range, prefixLen)) {
          matched = true;
          break;
        }
      } catch {
        // skip invalid CIDR entries
      }
    }
  }

  if (!matched) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'ip_not_whitelisted' });
  }

  return next();
});
