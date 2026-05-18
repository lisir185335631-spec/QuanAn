import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stepLsKey } from '@/lib/ls-namespace';
import {
  LEGACY_KEYS,
  MIGRATION_FLAG_KEY,
  migrateLegacyLs,
} from '../legacy-ls';

class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length() {
    return Object.keys(this.store).length;
  }

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key)
      ? (this.store[key] as string)
      : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return index >= 0 && index < keys.length ? (keys[index] as string) : null;
  }
}

describe('migrateLegacyLs', () => {
  let store: MockStorage;

  beforeEach(() => {
    store = new MockStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // (e) accountId === null → skip entirely, no FLAG written
  it('returns { migrated:0, skipped:0 } when accountId is null', () => {
    const result = migrateLegacyLs(store, null);
    expect(result).toEqual({ migrated: 0, skipped: 0 });
    expect(store.getItem(MIGRATION_FLAG_KEY)).toBeNull();
  });

  // (a) 0 legacy keys present → migrated=0, skipped=10, FLAG set
  it('returns migrated=0 skipped=10 and writes FLAG when no legacy keys exist', () => {
    const result = migrateLegacyLs(store, 42);
    expect(result.migrated).toBe(0);
    expect(result.skipped).toBe(LEGACY_KEYS.length);
    expect(store.getItem(MIGRATION_FLAG_KEY)).toBe('1');
  });

  // idempotency: second call skips all due to FLAG
  it('returns { migrated:0, skipped:10 } on subsequent calls due to FLAG', () => {
    store.setItem(MIGRATION_FLAG_KEY, '1');
    const result = migrateLegacyLs(store, 42);
    expect(result.migrated).toBe(0);
    expect(result.skipped).toBe(LEGACY_KEYS.length);
  });

  // (b) all 10 keys have data → migrated=10, old keys deleted, new keys written
  it('migrates all 10 legacy keys when all have data', () => {
    for (const key of LEGACY_KEYS) {
      store.setItem(key, JSON.stringify({ payload: key }));
    }

    const result = migrateLegacyLs(store, 42);

    expect(result.migrated).toBe(10);
    expect(result.skipped).toBe(0);
    expect(store.getItem(MIGRATION_FLAG_KEY)).toBe('1');

    for (const key of LEGACY_KEYS) {
      expect(store.getItem(key)).toBeNull();
    }
  });

  // (c) partial: new key already exists → don't overwrite new, delete old, count as skipped
  it('does not overwrite existing new key but still removes old key', () => {
    const accountId = 99;
    store.setItem('acc_step1', JSON.stringify({ fromOld: true }));
    const newKey = stepLsKey(accountId, 'step1');
    store.setItem(newKey, JSON.stringify({ fromNew: true }));

    const result = migrateLegacyLs(store, accountId);

    expect(store.getItem('acc_step1')).toBeNull();
    expect(store.getItem(newKey)).toBe(JSON.stringify({ fromNew: true }));
    // 1 existing new key → 1 skipped; 9 absent old keys → 9 skipped
    expect(result.skipped).toBe(10);
    expect(result.migrated).toBe(0);
  });

  // (c) partial: some keys have data, some don't
  it('migrates only keys that have old data and no new key conflict', () => {
    const accountId = 7;
    store.setItem('acc_step1', JSON.stringify({ v: 1 }));
    store.setItem('acc_step3', JSON.stringify({ v: 3 }));

    const result = migrateLegacyLs(store, accountId);

    expect(result.migrated).toBe(2);
    expect(result.skipped).toBe(8);
    expect(store.getItem(stepLsKey(accountId, 'step1'))).toBe(JSON.stringify({ v: 1 }));
    expect(store.getItem(stepLsKey(accountId, 'step3'))).toBe(JSON.stringify({ v: 3 }));
    expect(store.getItem('acc_step1')).toBeNull();
    expect(store.getItem('acc_step3')).toBeNull();
  });

  // special key: acc_step5_selected_topic → aiip_memory_acc_{id}_selected_topic
  it('migrates acc_step5_selected_topic to selected_topic suffix', () => {
    const accountId = 5;
    store.setItem('acc_step5_selected_topic', JSON.stringify({ topic: 'test' }));

    migrateLegacyLs(store, accountId);

    const expectedKey = stepLsKey(accountId, 'selected_topic');
    expect(store.getItem(expectedKey)).toBe(JSON.stringify({ topic: 'test' }));
    expect(store.getItem('acc_step5_selected_topic')).toBeNull();
  });

  // (d) QuotaExceededError → console.warn + continue, no throw
  it('handles QuotaExceededError gracefully: warns and continues', () => {
    const accountId = 1;
    store.setItem('acc_step1', JSON.stringify({ data: 'x' }));

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const originalSetItem = store.setItem.bind(store);
    store.setItem = (key: string, value: string): void => {
      if (key.startsWith('aiip_memory_acc_')) {
        throw new DOMException('storage full', 'QuotaExceededError');
      }
      originalSetItem(key, value);
    };

    expect(() => migrateLegacyLs(store, accountId)).not.toThrow();
    expect(warnSpy).toHaveBeenCalledOnce();
    const firstCallArg = warnSpy.mock.calls[0]?.[0] as string | undefined;
    expect(firstCallArg).toContain('QuotaExceededError');
  });
});
