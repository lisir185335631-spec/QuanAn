/**
 * LS namespace utilities — PRD-2 US-002 · ADR-010 dual-write strategy
 *
 * All client-side LS keys follow the pattern:
 *   aiip_memory_acc_{accountId}_{suffix}
 *
 * This ensures per-account isolation: switching accounts clears the old namespace,
 * multi-tab setups on different accounts never share data.
 */

/** Root prefix for all account-namespaced LS keys */
export const LS_PREFIX = 'aiip_memory_acc';

/** 5 MB limit: UTF-16 storage = 2 bytes/char, so chars limit = 5*1024*1024/2 */
export const LS_LIMIT_BYTES = 5 * 1024 * 1024;

// ── Key builders ──────────────────────────────────────────────────────────────

/** Step data key: aiip_memory_acc_{accountId}_{stepKey} */
export function stepLsKey(accountId: number, stepKey: string): string {
  return `${LS_PREFIX}_${accountId}_${stepKey}`;
}

/** Evolution profile key: aiip_memory_acc_{accountId}_evolution */
export function evolutionLsKey(accountId: number): string {
  return `${LS_PREFIX}_${accountId}_evolution`;
}

/** Tool data key (D-031): aiip_memory_acc_{accountId}_tool_{toolKey}_{suffix} */
export function getToolLsKey(accountId: number, toolKey: string, suffix: string): string {
  return `${LS_PREFIX}_${accountId}_tool_${toolKey}_${suffix}`;
}

/** General-purpose key: aiip_memory_acc_{accountId}_{suffix} */
export function getLsKey(accountId: number, suffix: string): string {
  return `${LS_PREFIX}_${accountId}_${suffix}`;
}

/** Prefix covering all keys for a given account */
export function accountLsPrefix(accountId: number): string {
  return `${LS_PREFIX}_${accountId}_`;
}

// ── Storage operations (accept Storage for testability) ───────────────────────

/**
 * Clear every LS key belonging to the given account namespace.
 * Called when the user switches active account (AC-2, AC-6).
 */
export function clearLsNamespace(store: Storage, accountId: number): void {
  const prefix = accountLsPrefix(accountId);
  const toRemove: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k?.startsWith(prefix)) toRemove.push(k);
  }
  // Iterate over snapshot — avoids index shift during removal
  toRemove.forEach((k) => store.removeItem(k));
}

/**
 * Estimate total LS usage in bytes (UTF-16: 2 bytes per char).
 * Used to decide whether pruning is needed (AC-8).
 */
export function lsUsedBytes(store: Storage): number {
  let chars = 0;
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i) ?? '';
    const v = store.getItem(k) ?? '';
    chars += k.length + v.length;
  }
  return chars * 2;
}

// ── Global (non-account-scoped) keys ─────────────────────────────────────────

/**
 * Persist the active account id for demo/tooling reads (AC-9).
 * GLOBAL KEY — intentionally not account-scoped: this value identifies
 * which account is currently active and therefore cannot be namespaced
 * under any particular account prefix.
 */
const ACTIVE_ACCOUNT_KEY = 'aiip_active_account_id';

/** Write the active account id to localStorage. */
export function setActiveAccountId(id: number): void {
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, String(id));
}

/** Read the active account id from localStorage, or null if absent. */
export function getActiveAccountId(): number | null {
  const raw = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

/**
 * Prune non-active account namespaces when usage exceeds 5 MB (AC-8).
 * Active account namespace is always preserved.
 */
export function pruneLsNamespaces(store: Storage, activeAccountId: number): void {
  if (lsUsedBytes(store) < LS_LIMIT_BYTES) return;

  const activePrefix = accountLsPrefix(activeAccountId);
  const toRemove: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k?.startsWith(LS_PREFIX) && !k.startsWith(activePrefix)) {
      toRemove.push(k);
    }
  }
  toRemove.forEach((k) => store.removeItem(k));
}
