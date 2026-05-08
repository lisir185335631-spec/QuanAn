/**
 * tRPC trace_id middleware — AC-5 (US-007)
 * Reads X-Trace-Id from request header; generates nanoid(16)-equivalent if absent.
 * Writes traceId to ctx.traceId and propagates via AsyncLocalStorage for pino auto-injection.
 *
 * Implementation note: middleware instance lives in @/trpc/trpc (avoids circular deps).
 * This file re-exports it and provides the standalone extractTraceId utility for testing.
 */

export { traceMiddleware, generateHttpTraceId } from '@/trpc/trpc';

/**
 * Extract trace ID from request headers.
 * Returns the header value if present, or empty string (caller generates fallback).
 */
export function extractTraceId(headers: Headers): string {
  return headers.get('x-trace-id') ?? headers.get('X-Trace-Id') ?? '';
}
