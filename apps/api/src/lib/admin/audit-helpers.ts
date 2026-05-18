// PRD-10 US-004 · audit helpers — redact, extractActionType, extractCrossAccountFlag

const SENSITIVE_SUBSTRINGS = ['password', 'token', 'apikey', 'secret', 'credential', 'authorization'];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_SUBSTRINGS.some((s) => lower.includes(s));
}

export function redactSensitiveFields(payload: unknown): unknown {
  if (payload === null || payload === undefined) return payload;
  if (typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload.map(redactSensitiveFields);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      result[key] = '[REDACTED]';
    } else if (value !== null && typeof value === 'object') {
      result[key] = redactSensitiveFields(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// camelCase procedure path segment → snake_case action type
// e.g. 'admin.user.banUser' → 'ban_user'
export function extractActionType(procedurePath: string): string {
  const parts = procedurePath.split('.');
  const last = parts[parts.length - 1] ?? procedurePath;
  return last.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

export function extractCrossAccountFlag(
  _input: unknown,
  ctx: { crossAccountAccessed?: boolean },
  _result: unknown,
): boolean {
  return ctx.crossAccountAccessed === true;
}
