import { stepLsKey } from '@/lib/ls-namespace';

export const MIGRATION_FLAG_KEY = 'aiip_legacy_migration_v1_done';

export const LEGACY_KEYS = [
  'acc_step1',
  'acc_step3',
  'acc_step3b',
  'acc_step4',
  'acc_step4b',
  'acc_step5',
  'acc_step5_selected_topic',
  'acc_step6',
  'acc_step7',
  'acc_step8',
] as const;

type LegacyKey = (typeof LEGACY_KEYS)[number];

// Maps each legacy key to the stepKey suffix used by stepLsKey()
const LEGACY_TO_STEP: Record<LegacyKey, string> = {
  acc_step1: 'step1',
  acc_step3: 'step3',
  acc_step3b: 'step3b',
  acc_step4: 'step4',
  acc_step4b: 'step4b',
  acc_step5: 'step5',
  // Cross-step bridge key → aiip_memory_acc_{accountId}_selected_topic
  acc_step5_selected_topic: 'selected_topic',
  acc_step6: 'step6',
  acc_step7: 'step7',
  acc_step8: 'step8',
};

export interface MigrationResult {
  migrated: number;
  skipped: number;
}

/**
 * One-shot migration of legacy `acc_step{N}` LS keys to the LD-009 namespaced format.
 * Uses MIGRATION_FLAG_KEY to prevent re-running on subsequent calls.
 */
export function migrateLegacyLs(store: Storage, accountId: number | null): MigrationResult {
  if (accountId === null) {
    return { migrated: 0, skipped: 0 };
  }

  if (store.getItem(MIGRATION_FLAG_KEY) === '1') {
    return { migrated: 0, skipped: LEGACY_KEYS.length };
  }

  let migrated = 0;
  let skipped = 0;

  for (const legacyKey of LEGACY_KEYS) {
    const oldData = store.getItem(legacyKey);

    if (oldData === null) {
      skipped++;
      continue;
    }

    const newKey = stepLsKey(accountId, LEGACY_TO_STEP[legacyKey]);

    // Preserve existing new-format data — don't overwrite, but still remove old key
    if (store.getItem(newKey) !== null) {
      store.removeItem(legacyKey);
      skipped++;
      continue;
    }

    try {
      store.setItem(newKey, oldData);
      store.removeItem(legacyKey);
      migrated++;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn(`[migrateLegacyLs] QuotaExceededError migrating "${legacyKey}"`, e);
        skipped++;
        continue;
      }
      throw e;
    }
  }

  store.setItem(MIGRATION_FLAG_KEY, '1');
  return { migrated, skipped };
}
